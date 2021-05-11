const { JSDOM } = require('jsdom');
const { AppConfig } = require('../../app.config');
const fs = require('fs');
const path = require('path');

async function execute(logger, req, broadcaster){

    if(req.session){
        req.session.returnTo = req.path;
    }

    // navbar
    const template = new JSDOM(fs.readFileSync(path.join(AppConfig.WEB_TEMPLATE_DIR, "index.html")));
    if(AppConfig.SESSION_UTILS.hasUserSession(req)){
        template.window.document.getElementById('log-in').innerHTML = `logged in as ${req.session.passport.user.data[0].login}`
    }

    // populate list
    const list = template.window.document.getElementById('list');
    if(broadcaster){
        template.window.document.getElementById('list-title').innerHTML = broadcaster;
        template.window.document.getElementsByTagName('title')[0].innerHTML = `${broadcaster}'s vault`;
        const files = await AppConfig.S3_CLIENT.getFileListForBroadcaster(logger, broadcaster);
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
    }
    else{
        template.window.document.getElementById('list-title').innerHTML = 'Broadcasters';
        const broadcasters = await AppConfig.S3_CLIENT.getBroadcasterFolderList(logger);
        broadcasters.forEach((value) => {
            const item = template.window.document.createElement('li');
            const anchor = template.window.document.createElement('a');
            anchor.href= `/broadcasters/${value}`;
            anchor.innerHTML = value;
            item.appendChild(anchor);
            list.appendChild(item);
        });
    }
    
    return template.serialize();
}

module.exports.execute = execute;