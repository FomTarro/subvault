const { JSDOM } = require('jsdom');
const { AppConfig } = require('../../app.config');
const fs = require('fs');
const path = require('path');

const pageCodes = {
    get HOME(){return 'HOME'},
    get BROADCASTER(){return 'BROADCASTER'},
    get UPLOAD(){return 'UPLOAD'},
}

async function execute(logger, req, options){

    const template = new JSDOM(fs.readFileSync(path.join(AppConfig.WEB_TEMPLATE_DIR, 'index.html')));

    // navbar
    if(req && req.session){
        req.session.returnTo = req.path;
    }

    if(AppConfig.SESSION_UTILS.hasUserSession(req)){
        template.window.document.getElementById('navbar-login-status').innerHTML = `logged in as ${req.session.passport.user.data[0].login}`
    }

    if(pageCodes.BROADCASTER == options.code){
        const list = template.window.document.getElementById('list');
        template.window.document.getElementById('upload-container').remove();
        if(options.broadcaster){
            // populate list
            template.window.document.getElementById('list-title').innerHTML = options.broadcaster;
            template.window.document.getElementsByTagName('title')[0].innerHTML = `${options.broadcaster}'s vault`;
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
            template.window.document.getElementById('list-title').innerHTML = '???';
            template.window.document.getElementsByTagName('title')[0].innerHTML = `???'s vault`;
        }
    }
    else if(pageCodes.HOME == options.code){
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
    }else if(pageCodes.UPLOAD == options.code){
        template.window.document.getElementById('list-container').remove();
        if(AppConfig.SESSION_UTILS.hasUserSession(req)){
            const uploaderName = req.session.passport.user.data[0].login
            if(AppConfig.TWITCH_ALLOWED_UPLOADERS.includes(uploaderName) == false){
                template.window.document.getElementById('upload-content').remove();
                template.window.document.getElementById('upload-warning-reason').innerHTML = 
                `You are logged in as ${uploaderName}, who does not have permission to upload at this time.`
            }else{
                template.window.document.getElementById('upload-warning').remove();
            }
        }else{
            template.window.document.getElementById('upload-content').remove();
            template.window.document.getElementById('upload-warning-reason').innerHTML = 
            `Please log in with an authorized Twitch account in order to upload!`
        }
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

module.exports.populateFileList = populateFileList;
module.exports.populateBroadcasterList = populateBroadcasterList;
module.exports.populateUploadPage = populateUploadPage;