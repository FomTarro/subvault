require('dotenv').config();
const path = require("path");

const appConfig = {

    // config vars
    get ENV(){ return process.env.NODE_ENV || 'local'; },
    get PORT(){ return process.env.PORT || 8080; },
    get DOMAIN(){ return process.env.domain || `http://localhost:${this.PORT}` },
    get SESSION_SECRET(){ return process.env.session_secret; },
    get TWITCH_CLIENT_ID(){ return process.env.twitch_client_id; },
    get TWITCH_CLIENT_SECRET(){ return process.env.twitch_client_secret; },
    get CALLBACK_URL() { return `${this.DOMAIN}/auth/twitch/callback`; },
    get WEB_LOAD_DIR(){ return path.join(__dirname, 'public'); },
    get WEB_TEMPLATE_DIR(){ return path.join(__dirname, 'templates'); },
    get FILE_LOAD_DIR(){ return path.join(__dirname); },

    // clients
    get USER_SUB_CLIENT(){ return require('./src/boundary/adapters/user.subscriber.client')},
    get USER_ID_CLIENT(){ return require('./src/boundary/adapters/user.id.client')},

    // use cases
    get POPULATE_FILE_LISTS(){ return (require('./src/usecases/populate.file.lists.usecase'))},

    // models
    get WEB_SERVER() { return require('./src/boundary/web.server'); },

    // utils
    get HTTP_UTILS(){ return require('./src/utils/http.utils'); },
    get FILE_UTILS(){ return require('./src/utils/file.utils'); },
    get SESSION_UTILS(){ return require('./src/utils/session.utils'); },
}

module.exports.AppConfig = appConfig;