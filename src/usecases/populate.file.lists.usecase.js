const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { AppConfig } = require('../../app.config');

async function execute(req, broadcaster){
    if(req.session){
        req.session.returnTo = req.path;
    }
    const template = new JSDOM(fs.readFileSync(path.join(AppConfig.WEB_TEMPLATE_DIR, "index.html")));
    if(AppConfig.SESSION_UTILS.hasUserSession(req)){
        template.window.document.getElementById('log-in').innerHTML = `logged in as ${req.session.passport.user.data[0].login}`
    }
    const list = template.window.document.getElementById('list');
    if(broadcaster){
        template.window.document.getElementById('list-title').innerHTML = broadcaster;
        const fileList = [];
        const files = AppConfig.FILE_UTILS.walkSync(path.join(AppConfig.FILE_LOAD_DIR, 'vault', broadcaster), fileList);
        files.forEach((value) => {
            const item = template.window.document.createElement('li');
            const anchor = template.window.document.createElement('a');
            const rel = value.replace(AppConfig.FILE_LOAD_DIR, "");
            anchor.href = rel;
            anchor.innerHTML = rel.replace(path.join('vault', broadcaster), "");
            item.appendChild(anchor);
            list.appendChild(item);
        });
    }
    else{
        template.window.document.getElementById('list-title').innerHTML = 'Broadcasters';
        const broadcasters = AppConfig.FILE_UTILS.getAllDirectories(path.join(AppConfig.FILE_LOAD_DIR, 'vault'));
        broadcasters.forEach((value) => {
            const item = template.window.document.createElement('li');
            const anchor = template.window.document.createElement('a');
            anchor.href= `/broadcasters/${value}`;
            anchor.innerHTML = value;
            item.appendChild(anchor);
            list.appendChild(item);
        });
    }
    //fs.writeFileSync(path.join(AppConfig.WEB_LOAD_DIR, "index.html"), template.serialize());
    return template.serialize();
}

module.exports.execute = execute;