const AppConfig = require('../../../app.config').AppConfig;

const scope = 'no_scope'

async function getUserInfo(logger, username){
    var info = {};
    await AppConfig.HTTP_UTILS.request(
        logger,
        {
            scope: scope,
            host: `api.twitch.tv`,
            endpoint: `/helix/users?login=${username}`,
            method: 'GET'
        },
        (buffer) => { 
            info = JSON.parse(buffer).data[0];
        },
        (error) => { 
        },
    );
    return info;
}

module.exports.getUserInfo = getUserInfo;