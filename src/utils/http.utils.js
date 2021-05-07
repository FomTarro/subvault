const https = require('https');
const { AppConfig } = require('../../app.config');

/**
 * Helper function for making web requests
 * @param {*} url The URL to GET
 * @param {*} resolve The callback to execute on success (accepts in a Buffer)
 * @param {*} reject The callback to execute on failure (accepts in an Exception)
 * @param {*} logger The logger to print with
 */
 async function webRequest(options, resolve, reject, logger){
    const formattedOptions = {
        hostname: options.host,
        port: 443,
        path: options.endpoint,
        method: options.method 
    };
    if(options.scope){
        logger.log('fetching token...');
        formattedOptions.headers = {
            'Authorization': 'Bearer ' + (options.scope == 'no_scope' ? 
            await getTokenNoScope(AppConfig.TWITCH_CLIENT_ID, AppConfig.TWITCH_CLIENT_SECRET) : 
            await getTokenScope(options.scope, AppConfig.TWITCH_CLIENT_ID, AppConfig.TWITCH_CLIENT_SECRET)),
            'Client-Id': AppConfig.TWITCH_CLIENT_ID,
        }
        logger.log(`token retrieved: ${formattedOptions['Authorization']}`);
        // optionsget.headers['Client-ID'] = AppConfig.TWITCH_CLIENT_ID;
    }
    return new Promise(function(resolve, reject){
        const buffers = [];
        logger.log(formattedOptions);
        request(formattedOptions, buffers, logger, resolve, reject);
    }).then(function(buffers){
        const combined = Buffer.concat(buffers);
        resolve(combined);
    }).catch(function(err){
        logger.error(err);
        reject(err);
    });
}

async function request(options, buffers, log, resolve, reject){
    log.log(options);
    // do http request
    // if 301, 302, 307, recurse with new URL and pass promise chain in
    // if 200 or whatever, resolve
    try{
        const proxyReq = https.request(options, proxyRes => {            
            log.log(`https statusCode: ${proxyRes.statusCode}`);
            if(proxyRes.statusCode == 301 || proxyRes.statusCode == 302 || proxyRes.statusCode == 307){
                log.log(`following redirect to ${proxyRes.headers.location}`);
                // TODO: test this!
                // parse url of location, switch path
                request(options, buffers, log, resolve, reject);
            }else if(!(proxyRes.statusCode == 200 || proxyRes.statusCode == 206)){
                reject(options);
            }else{
                proxyRes.on('data', d => {
                    // accumulate buffer data to present at the end
                    buffers.push(d);
                });
                proxyRes.on('end', () => {
                    // time to present the buffer data!
                    if(buffers.length > 0){
                        resolve(buffers);
                    }
                    else{
                        reject(options);
                    }
                });
            }
        });
        proxyReq.on('error', (err) => {
            reject(err);
        })
        proxyReq.end();
    }catch(e){
        reject(e);
    }
}

async function getTokenScope(scope, clientId, clientSecret){
    var token = undefined;
    console.log(`getting token for scope : ${scope}`);
    await webRequest(
        {
            host: `id.twitch.tv`,
            endpoint: `/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials&scope=${scope}`,
            method: 'POST',
        },
        (buffer) => { 
            token = JSON.parse(buffer); 
        },
        (err) => { 
            token = {
                access_token: 'ERROR_TOKEN'
            };
        },
        console
    );
    return token.access_token;
}

async function getTokenNoScope(clientId, clientSecret){
    var token = undefined;
    console.log(`getting token`);
    await webRequest(
        {
            host: `id.twitch.tv`,
            endpoint: `/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
            method: 'POST',
        },
        (buffer) => { 
            token = JSON.parse(buffer); 
        },
        (err) => { 
            token = {
                access_token: 'ERROR_TOKEN'
            }
        },
        console
    );
    return token.access_token;
}

module.exports.request = webRequest;
module.exports.getToken = getTokenScope;