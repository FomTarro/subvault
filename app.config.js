require('dotenv').config();
const path = require("path");

const appConfig = {

    // config vars
    get ENV(){ return process.env.NODE_ENV || 'local'; },
    get PORT(){ return process.env.PORT || 8080; },
    get DOMAIN(){ return process.env.domain || `http://localhost:${this.PORT}` },
    get SESSION_SECRET(){ return process.env.session_secret; },
    get RATE_LIMIT_WINDOW_MS(){return process.env.rate_limit_window_ms || 15 * 60 * 1000;},
    get RATE_LIMIT_MAX_REQUESTS(){return process.env.rate_limit_max_requests || 100;},

    get TWITCH_CLIENT_ID(){ return process.env.twitch_client_id; },
    get TWITCH_CLIENT_SECRET(){ return process.env.twitch_client_secret; },
    get TWITCH_ALLOWED_UPLOADERS(){ return process.env.twitch_uploader_logins.split(","); },
    get CALLBACK_URL() { return `${this.DOMAIN}/auth/twitch/callback`; },

    get S3_BUCKET_NAME(){ return process.env.s3_bucket_name; },
    get S3_ID() { return process.env.s3_id; },
    get S3_SECRET(){ return process.env.s3_secret; },
    get PARTITION_PER_USER_BYTES(){ return process.env.partition_max_size_bytes; },

    get WEB_PUBLIC_DIR(){ return path.join(__dirname, 'public'); },
    get WEB_TEMPLATE_DIR(){ return path.join(__dirname, 'templates'); },

    // clients
    get TWITCH_CLIENT(){ return require('./src/boundary/adapters/twitch.api.client')},
    get S3_CLIENT(){ return require('./src/boundary/adapters/s3.storage.client')},

    // use cases
    get POPULATE_HTML_PAGE(){ return (require('./src/usecases/populate.html.page.usecase'))},

    // models
    get WEB_SERVER() { return require('./src/boundary/web.server'); },
    get LOGGER(){ return require('./src/utils/logger'); },
    get LRU(){ return require('./src/utils/lru'); },

    // utils
    get HTTP_UTILS(){ return require('./src/utils/http.utils'); },
    get FILE_UTILS(){ return require('./src/utils/file.utils'); },
    get SESSION_UTILS(){ return require('./src/utils/session.utils'); },
}

module.exports.AppConfig = appConfig;