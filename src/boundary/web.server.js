const AppConfig = require('../../app.config').AppConfig;
const express = require("express");
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const request = require('request');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');

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

    // app.use('/', express.static(AppConfig.WEB_LOAD_DIR));
    app.use(passport.initialize());
    app.use(passport.session());

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
    app.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/', failureRedirect: '/' }));

    // Define a simple template to safely generate HTML with values from user's profile
    const template = handlebars.compile(`
    <html><head><title>Twitch Auth Sample</title></head>
    <table>
        <tr><th>Access Token</th><td>{{accessToken}}</td></tr>
        <tr><th>Refresh Token</th><td>{{refreshToken}}</td></tr>
        <tr><th>Display Name</th><td>{{display_name}}</td></tr>
        <tr><th>Bio</th><td>{{bio}}</td></tr>
        <tr><th>Image</th><td>{{logo}}</td></tr>
    </table></html>`);

    // If user has an authenticated session, display it, otherwise display link to authenticate
    app.use('/', express.static(AppConfig.WEB_LOAD_DIR));

    app.get('/vault/:broadcaster/*', async (req, res) => {
        if(hasUserSession(req)){
            const user_id = req.session.passport.user.data[0].id;
            const broadcaster_id = await AppConfig.USER_ID_CLIENT.getUserId(req.params.broadcaster);
            if(await AppConfig.USER_SUB_CLIENT.getUserSub(user_id, broadcaster_id, req.session.passport.user.accessToken) == true){
                const filePath = path.join(AppConfig.FILE_LOAD_DIR, req.path)
                if(fs.existsSync(filePath)){
                    res.download(filePath);
                }else{
                    res.send(`${filePath} not found`).status(204);
                }
            }else{
                res.send("Not Sub!").status(204);
            }
        }else{
            res.send("no session!").status(204);
        }
    })
    return app;
}


function hasUserSession(req){
    return req.session && req.session.passport && req.session.passport.user;
}

module.exports = setup;