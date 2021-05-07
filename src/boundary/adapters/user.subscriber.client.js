const AppConfig = require('../../../app.config').AppConfig;

const scope = 'user_read_subscriptions'

async function getUserSub(userId, broadcasterId){
    var isSub = false;
    await AppConfig.HTTP_UTILS.request(
        {
            scope: scope,
            host: `api.twitch.tv`,
            endpoint: `/helix/subscriptions/user?broadcaster_id=${broadcasterId}&user_id=${userId}`,
            method: 'GET'
        },
        (buffer) => { 
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