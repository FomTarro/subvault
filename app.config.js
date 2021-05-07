require('dotenv').config();
const path = require("path");

const appConfig = {

    // config vars
    get ENV(){ return process.env.NODE_ENV || 'local'; },
    get PORT(){ return process.env.PORT || 8080; },
    get DOMAIN(){ return process.env.domain || `localhost:${this.PORT}` },
    get SESSION_SECRET(){ return process.env.session_secret; },
    get WEB_LOAD_DIR(){ return path.join(__dirname, 'public'); },

    // use cases
    // TBD
    
    // models
    get WEB_SERVER() { return require('./src/boundary/web.server'); },

    // utils
    get HTTP_UTILS(){ return require('./src/utils/http.utils'); },
}

module.exports.AppConfig = appConfig;