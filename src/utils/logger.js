const { AppConfig } = require("../../app.config");

class Logger {
    constructor(metadata){ this.metadata = metadata ?  metadata : {}; }

    log(message){ if(AppConfig.ENV != 'test') console.log(`[INFO] (${new Date().toLocaleString()}) => [${JSON.stringify(this.metadata)}] - ${message}`); }
    warn(message){ if(AppConfig.ENV != 'test') console.warn(`[WARN] (${new Date().toLocaleString()}) => [${JSON.stringify(this.metadata)}] - ${message}`); }
    error(message){ if(AppConfig.ENV != 'test') console.error(`[FAIL] (${new Date().toLocaleString()}) => [${JSON.stringify(this.metadata)}] - ${message}`); }
}

module.exports.Logger = Logger;