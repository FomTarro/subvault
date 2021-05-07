const AppConfig = require('../../../app.config').AppConfig;

async function getUserSub(userId, broadcasterId, token){
    var isSub = false;
    await AppConfig.HTTP_UTILS.request(
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
        console
    );
    return isSub;
}

module.exports.getUserSub = getUserSub;