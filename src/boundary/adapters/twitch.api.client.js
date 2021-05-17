const AppConfig = require('../../../app.config').AppConfig;


async function getUserInfo(logger, username){
    const scope = 'no_scope'
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
            // TODO: map results to a domain data structure 
            // to insulate other code from API changes
            info = JSON.parse(buffer).data[0];
        },
        (error) => { 
            logger.error(error);
        },
    );
    return info;
}

async function getUserIsSub(logger, userId, broadcasterId, token){
    var isSub = false;
    await AppConfig.HTTP_UTILS.request(
        logger,
        {
            token: token,
            host: `api.twitch.tv`,
            endpoint: `/helix/subscriptions/user?broadcaster_id=${broadcasterId}&user_id=${userId}`,
            method: 'GET'
        },
        (buffer) => { 
            // logger.log(buffer.toString());
            isSub = true;
        },
        (error) => { 
            logger.error(error);
            isSub = false;
        },
    );
    return isSub;
}

module.exports.getUserInfo = getUserInfo;
module.exports.getUserIsSub = getUserIsSub;