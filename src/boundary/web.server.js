const AppConfig = require('../../app.config').AppConfig;
const express = require("express");
const session = require('express-session');
const fs = require('fs');
const path = require("path");

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

    app.use('/', express.static(AppConfig.WEB_LOAD_DIR));
    

    app.post('/oauth-redirect', (req, res) => {
        console.log(req.body);
        res.status(200).send();
    })


    return app;
}

module.exports = setup;