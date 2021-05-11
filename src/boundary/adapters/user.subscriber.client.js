const AppConfig = require('../../../app.config').AppConfig;

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

module.exports.getUserSub = getUserSub;