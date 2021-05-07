const fs = require('fs'); 
const path = require('path');

function walkSync(dir, filelist, regex) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist, regex);
        } else {
            if(regex){
                if(file.search(regex) >= 0){
                    filelist.push(path.join(dir, file));
                }
            }else{
                filelist.push(path.join(dir, file));
            }
        }
    });
    return filelist;
}

function getAllDirectories(dir){
    return fs.readdirSync(dir).filter(function (file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

module.exports.walkSync = walkSync;
module.exports.getAllDirectories = getAllDirectories;