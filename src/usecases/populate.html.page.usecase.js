const { JSDOM } = require('jsdom');
const { AppConfig } = require('../../app.config');
const fs = require('fs');
const path = require('path');

const pageCodes = {
    get HOME(){return 'HOME'},
    get BROADCASTER(){return 'BROADCASTER'},
    get UPLOAD(){return 'UPLOAD'},
    get ERROR(){return 'ERROR'},
}

async function execute(logger, req, options){

    const template = new JSDOM(fs.readFileSync(path.join(AppConfig.WEB_TEMPLATE_DIR, 'index.html')));

    // navbar
    if(req && req.session){
        req.session.returnTo = req.path;
    }

    if(AppConfig.SESSION_UTILS.hasUserSession(req)){
        template.window.document.getElementById('navbar-login-status').innerHTML = 
        `logged in as <b>${req.session.passport.user.data[0].login}</b> (<a href='/auth/twitch/logout'>log out</a>)`
    }

    if(pageCodes.HOME == options.code){
        // populate list
        const list = template.window.document.getElementById('list');
        template.window.document.getElementById('upload-container').remove();
        template.window.document.getElementById('list-title').innerHTML = 'Broadcasters';
        const broadcasters = await AppConfig.S3_CLIENT.getBroadcasterFolderList(logger);
        broadcasters.forEach((value) => {
            const item = template.window.document.createElement('li');
            const anchor = template.window.document.createElement('a');
            anchor.href = `/broadcasters/${value}`;
            anchor.innerHTML = value;
            item.appendChild(anchor);
            list.appendChild(item);
        });
    }
    else if(pageCodes.BROADCASTER == options.code){
        const list = template.window.document.getElementById('list');
        template.window.document.getElementById('upload-container').remove();
        const broadcasters = await AppConfig.S3_CLIENT.getBroadcasterFolderList(logger);
        if(options.broadcaster && broadcasters.includes(options.broadcaster)){
            // populate list
            const broadcasterInfo = await AppConfig.TWITCH_CLIENT.getUserInfo(console, options.broadcaster);
            const imgUrl = broadcasterInfo.profile_image_url;
            const title = `${options.broadcaster}'s vault`;
            template.window.document.getElementById('list-title').innerHTML = 'Files';

            template.window.document.getElementById('alert-img').src = imgUrl;
            template.window.document.getElementById('alert-title').innerHTML = broadcasterInfo.display_name;
            const channel = template.window.document.createElement('a');
            channel.href = `https://www.twitch.tv/${options.broadcaster}`;
            channel.target = '#'
            channel.innerHTML = 'channel';
            const span = template.window.document.createElement('span');
            span.classList.add('channel-link');
            span.appendChild(channel);
            span.innerHTML = ` [${span.innerHTML}]`
            template.window.document.getElementById('alert-title').appendChild(span);
            template.window.document.getElementById('alert-desc').innerHTML = broadcasterInfo.description;

            // meta
            template.window.document.getElementsByTagName('title')[0].innerHTML = title;
            template.window.document.getElementById('meta-img').content = imgUrl;
            template.window.document.getElementById('meta-title').content = title;
            template.window.document.getElementById('meta-desc').content = `Check out the files that ${options.broadcaster} has shared with their Twitch subscribers!`;
            const files = await AppConfig.S3_CLIENT.getFileListForBroadcaster(logger, options.broadcaster);
            files.forEach((value) => {
                const item = template.window.document.createElement('li');
                const anchor = template.window.document.createElement('a');
                const fileName = value.Key;
                const relPath = `../vault/${fileName}`;
                anchor.href = relPath
                anchor.innerHTML = fileName;
                item.appendChild(anchor);
                list.appendChild(item);
            });
        }else{
            return await populateErrorPage(logger, req, 
                '404', 
                `No page for ${req.params.broadcaster} exists.`);
        }
    }
    else if(pageCodes.UPLOAD == options.code){
        template.window.document.getElementById('alert-container').remove();
        template.window.document.getElementById('list-container').remove();
        const title = 'Vault Upload'
        template.window.document.getElementsByTagName('title')[0].innerHTML = title;
        template.window.document.getElementById('meta-title').content = title;
        if(AppConfig.SESSION_UTILS.hasUserSession(req)){
            const uploaderName = req.session.passport.user.data[0].login
            if(AppConfig.TWITCH_ALLOWED_UPLOADERS.includes(uploaderName) == false){
                return await populateErrorPage(logger, req, 
                    'Permission Denied',
                    `You are logged in as <b>${uploaderName}</b>, who does not have permission to upload at this time. <br><br>
                    The site is currently in closed beta, 
                    but if you're interested in getting upload permission, 
                    please Tweet at or DM the webmaster (<a target='#' href='https://twitter.com/FomTarro'>@FomTarro</a>).`);
            }
        }else{
            return await populateErrorPage(logger, req, 
                'Permission Denied',
                `Please log in with an authorized Twitch account in order to upload!`);
        }
    }else if(pageCodes.ERROR == options.code){
        template.window.document.getElementById('list-container').remove();
        template.window.document.getElementById('upload-container').remove();
        template.window.document.getElementById('alert-title').innerHTML = options.title;
        template.window.document.getElementById('alert-desc').innerHTML = options.message;
        template.window.document.getElementById('alert-img').remove();
    }
    
    return template.serialize();
}

async function populateFileList(logger, req, broadcaster){
    return await execute(logger, req, {
        broadcaster: broadcaster,
        code: pageCodes.BROADCASTER,
    })
}

async function populateBroadcasterList(logger, req){
    return await execute(logger, req, {
        code: pageCodes.HOME,
    })
}

async function populateUploadPage(logger, req){
    return await execute(logger, req, {
        code: pageCodes.UPLOAD,
    })
}

async function populateErrorPage(logger, req, errorTitle, errorMessage){
    logger.error(`ERROR ${req.path}`);
    return await execute(logger, req, {
        code: pageCodes.ERROR,
        title: errorTitle,
        message: errorMessage,
    })
}

module.exports.populateFileList = populateFileList;
module.exports.populateBroadcasterList = populateBroadcasterList;
module.exports.populateUploadPage = populateUploadPage;
module.exports.populateErrorPage = populateErrorPage;