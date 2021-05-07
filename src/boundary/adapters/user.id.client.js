const AppConfig = require('../../../app.config').AppConfig;

const scope = 'no_scope'

async function getUserId(username){
    var id = undefined
    await AppConfig.HTTP_UTILS.request(
        {
            scope: scope,
            host: `api.twitch.tv`,
            endpoint: `/helix/users?login=${username}`,
            method: 'GET'
        },
        (buffer) => { 
            id = JSON.parse(buffer).data[0].id;
        },
        (error) => { 
        },
        console
    );
    return id;
}

module.exports.getUserId = getUserId;