const https = require('https');
const { AppConfig } = require('../../app.config');

/**
 * Helper function for making web requests
 * @param {*} logger The logger to print with
 * @param {*} options The request options: host, endpoint, method, and optionally scope and token
 * @param {*} resolve The callback to execute on success (accepts in a Buffer)
 * @param {*} reject The callback to execute on failure (accepts in an Exception)
 */
 async function webRequest(logger, options, resolve, reject){
    const formattedOptions = {
        hostname: options.host,
        port: 443,
        path: options.endpoint,
        method: options.method 
    };
    // use token if one given
    if(options.token){
        formattedOptions.headers = {
            'Authorization': 'Bearer ' + options.token,
            'Client-Id': AppConfig.TWITCH_CLIENT_ID,
        }
    }
    // else get token for scope
    else if(options.scope){
        formattedOptions.headers = {
            'Authorization': 'Bearer ' + (options.scope == 'no_scope' ? 
            await getTokenNoScope(logger, AppConfig.TWITCH_CLIENT_ID, AppConfig.TWITCH_CLIENT_SECRET) : 
            await getTokenScope(logger, options.scope, AppConfig.TWITCH_CLIENT_ID, AppConfig.TWITCH_CLIENT_SECRET)),
            'Client-Id': AppConfig.TWITCH_CLIENT_ID,
        }
    }

    return new Promise(function(resolve, reject){
        const buffers = [];
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
                //request(options, buffers, log, resolve, reject);
                reject(proxyRes.statusCode);
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

async function getTokenScope(logger, scope, clientId, clientSecret){
    var token = undefined;
    await webRequest(
        logger,
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
    );
    return token.access_token;
}

async function getTokenNoScope(logger, clientId, clientSecret){
    var token = undefined;
    await webRequest(
        logger,
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
    );
    return token.access_token;
}

module.exports.request = webRequest;