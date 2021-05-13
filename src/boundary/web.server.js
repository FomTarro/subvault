const AppConfig = require('../../app.config').AppConfig;
const express = require("express");
const fileUpload = require('express-fileupload');
const path = require('path');
const stream = require('stream');

async function setup(){
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.set('trust proxy', 1);
    // --- PASSPORT AUTH ---
    await setupPassport(app);
    // --- PAGES ---
    await setupRoutes(app);
    
    return app;
}

async function setupSessions(app){
    const session = require('express-session');
    const store = new session.MemoryStore();
    
    app.use(session({
            name: "session",
            store: store,
            secret: AppConfig.SESSION_SECRET, 
            cookie: { 
            httpOnly: true,
            secure: (AppConfig.ENV != 'local'),
            maxAge: (60 * 60 * 1000)
        },
        rolling: true,
        resave: true,
        saveUninitialized: true
    }));
}

async function setupPassport(app){
    const passport = require('passport');
    const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
    const request = require('request');

    await setupSessions(app);
    app.use(passport.initialize());
    app.use(passport.session());
    app.router = { strict: true }

    // --- PASSPORT AUTH ---

    // Override passport profile function to get user profile from Twitch API
    OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    const options = {
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
        'Client-ID': AppConfig.TWITCH_CLIENT_ID,
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Authorization': 'Bearer ' + accessToken
        }
    };

    request(options, function (error, response, body) {
        if (response && response.statusCode == 200) {
            done(null, JSON.parse(body));
        } else {
            done(JSON.parse(body));
        }
    });
    }

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    passport.use('twitch', new OAuth2Strategy({
        authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
        tokenURL: 'https://id.twitch.tv/oauth2/token',
        clientID: AppConfig.TWITCH_CLIENT_ID,
        clientSecret: AppConfig.TWITCH_CLIENT_SECRET,
        callbackURL: AppConfig.CALLBACK_URL,
        state: true,
    },
    function(accessToken, refreshToken, profile, done) {
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
        done(null, profile);
    }
    ));

    // Set route to start OAuth link, this is where you define scopes to request
    app.get('/auth/twitch', passport.authenticate('twitch', { scope: 'user:read:subscriptions' }));

    // Set route for OAuth redirect
    app.get('/auth/twitch/callback', passport.authenticate('twitch', { 
        successReturnToOrRedirect: '/',
        failureRedirect: '/' 
    }));

    return app;
}

async function setupRoutes(app){
    app.router = { strict: true }
    app.get('/', async (req, res) => {
        const logger = new AppConfig.LOGGER.Logger({path: req.path});
        const page = await AppConfig.POPULATE_HTML_PAGE.populateBroadcasterList(logger, req);
        res.status(200).send(page);
    });

    app.get('/css*', (req, res) => {
        res.sendFile(path.join(AppConfig.WEB_PUBLIC_DIR, req.path))
    });
    app.get('/js*', (req, res) => {
        res.sendFile(path.join(AppConfig.WEB_PUBLIC_DIR, req.path))
    });

    app.get('/broadcasters/:broadcaster', async (req, res) => {
        const logger = new AppConfig.LOGGER.Logger({path: req.path});
        const page = await AppConfig.POPULATE_HTML_PAGE.populateFileList(logger, req, req.params.broadcaster);
        res.status(200).send(page);
    })

    // file download
    app.get('/vault/:broadcaster/*', async (req, res) => {
        const logger = new AppConfig.LOGGER.Logger({path: req.path});
        if(AppConfig.SESSION_UTILS.hasUserSession(req)){
            const userId = req.session.passport.user.data[0].id;
            const broadcasterId = (await AppConfig.TWITCH_CLIENT.getUserInfo(logger, req.params.broadcaster)).id;
            const accessToken = req.session.passport.user.accessToken;
            if(userId == broadcasterId || (await AppConfig.TWITCH_CLIENT.getUserSub(logger, userId, broadcasterId, accessToken)) == true){
                const file = await AppConfig.S3_CLIENT.getFileByPath(logger, req.path.replace('/vault/', '')); 
                if(file && file.ContentType && file.Body){ 
                    const readStream = new stream.PassThrough();
                    readStream.end(file.Body);
                    res.set('Content-disposition', `attachment; filename=${path.basename(req.path)}`);
                    res.set('Content-Type', file.ContentType);
                    readStream.pipe(res);
                }
                else{
                    const page = await AppConfig.POPULATE_HTML_PAGE.populateErrorPage(logger, req, 
                        '404', 
                        'The file you are requesting cannot be found.')
                    res.status(404).send(page);
                }
            }else{
                const page = await AppConfig.POPULATE_HTML_PAGE.populateErrorPage(logger, req, 
                    'Permission Denied', 
                    `Files belonging to ${req.params.broadcaster} are available only to their subscribers.`)
                res.status(200).send(page);
            }
        }else{
            const page = await AppConfig.POPULATE_HTML_PAGE.populateErrorPage(logger, req, 
                'Permission Denied', 
                "Please <a href='/auth/twitch'>log in with Twitch!</a>")
            res.status(200).send(page);
        }
    });

    app.get('/upload', async (req, res) => {
        const logger = new AppConfig.LOGGER.Logger({path: req.path});
        const page = await AppConfig.POPULATE_HTML_PAGE.populateUploadPage(logger, req);
        res.status(200).send(page);
    });

    app.use(fileUpload());
    app.post('/upload', async (req, res) => {    
        const logger = new AppConfig.LOGGER.Logger({path: req.path});
        if(AppConfig.SESSION_UTILS.hasUserSession(req)){
            const uploaderName = req.session.passport.user.data[0].login;
            if(AppConfig.TWITCH_ALLOWED_UPLOADERS.includes(uploaderName)){
                // Binary data base64
                // NOTE *.upload.* is the name of the html form tag
                // if that changes, this code also needs to change
                const fileContent = Buffer.from(req.files.upload.data, 'binary');
                const sanitizedFileName = AppConfig.FILE_UTILS.makeFileNameSafe(req.files.upload.name);
                const filePath = AppConfig.S3_CLIENT.joinPathForS3(uploaderName, sanitizedFileName); // AWS demands forward slashes!
                const result = await AppConfig.S3_CLIENT.uploadFile(logger, filePath, fileContent);
                logger.log(result);
                res.redirect(`/broadcasters/${uploaderName}`);
            }else{
                const page = await AppConfig.POPULATE_HTML_PAGE.populateErrorPage(logger, req, 
                    'Permission Denied', 
                    "This account is not authorized to upload.")
                res.status(403).send(page);
            }
        }else{
            const page = await AppConfig.POPULATE_HTML_PAGE.populateErrorPage(logger, req, 
                'Permission Denied', 
                "Please <a href='/auth/twitch'>log in with Twitch!</a>")
            res.status(403).send(page);
        }
    });

    // custom 404
    app.get('*', async (req, res) => {
        // log so we have a record of what URL folks are trying to hit
        const logger = new AppConfig.LOGGER.Logger({url: req.path});
        logger.error("page not found");
        const page = await AppConfig.POPULATE_HTML_PAGE.populateErrorPage(logger, req, 
            '404', 
            'The page you are requesting cannot be found.')
        res.status(404).send(page)
    });

    return app;
}

module.exports = setup;