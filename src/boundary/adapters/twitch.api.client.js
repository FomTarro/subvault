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
            info = JSON.parse(buffer).data[0];
        },
        (error) => { 
        },
    );
    return info;
}

async function getUserSub(logger, userId, broadcasterId, token){
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
            // console.log(buffer.toString());
            isSub = true;
        },
        (error) => { 
            isSub = false;
        },
    );
    return isSub;
}

module.exports.getUserInfo = getUserInfo;
module.exports.getUserSub = getUserSub;