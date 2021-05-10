const AppConfig = require('../../app.config').AppConfig;
const express = require("express");
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const request = require('request');
const path = require('path');
const fs = require('fs');

const hasUserSession = AppConfig.SESSION_UTILS.hasUserSession;

async function setup(){
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.set('trust proxy', 1);

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

    app.use(passport.initialize());
    app.use(passport.session());
    app.router = { strict: true }

    app.get('/', async (req, res) => {
        const page = await AppConfig.POPULATE_FILE_LISTS.execute(req);
        res.status(200).send(page);
    });

    app.get('/css*', (req, res) => {
        res.sendFile(path.join(AppConfig.WEB_LOAD_DIR, req.path))
    });
    app.get('/js*', (req, res) => {
        res.sendFile(path.join(AppConfig.WEB_LOAD_DIR, req.path))
    });

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
        failureRedirect: '/' }));

    app.get('/broadcasters/:broadcaster', async (req, res) => {
        const broadcasters = AppConfig.FILE_UTILS.getAllDirectories(path.join(AppConfig.FILE_LOAD_DIR, 'vault'))
        if(broadcasters.includes(req.params.broadcaster)){
            //const broadcaster_id = await AppConfig.USER_ID_CLIENT.getUserInfo(req.params.broadcaster).id;
            const page = await AppConfig.POPULATE_FILE_LISTS.execute(req, req.params.broadcaster);
            res.send(page);
        }else{
            res.send(`404: no page for ${req.params.broadcaster} exists`).status(404);
        }
    })

    app.get('/vault/:broadcaster/*', async (req, res) => {
        if(hasUserSession(req)){
            const user_id = req.session.passport.user.data[0].id;
            const broadcaster_id = (await AppConfig.USER_ID_CLIENT.getUserInfo(req.params.broadcaster)).id;
            if(user_id == broadcaster_id || (await AppConfig.USER_SUB_CLIENT.getUserSub(user_id, broadcaster_id, req.session.passport.user.accessToken)) == true){
                const filePath = path.join(AppConfig.FILE_LOAD_DIR, req.path)
                if(fs.existsSync(filePath)){
                    res.download(filePath);
                }else{
                    res.send(`file: ${filePath} not found`).status(204);
                }
            }else{
                res.send("file is available for subscribers only").status(204);
            }
        }else{
            res.send("please <a href='/auth/twitch'>log in with Twitch!</a>").status(204);
        }
        // TODO: make these not redirect to new pages if not allowed
    });
    return app;
}

module.exports = setup;