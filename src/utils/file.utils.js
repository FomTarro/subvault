function makeFileNameSafe(string){
    return string ? string.replace(/[^a-z0-9.]/gi, '_') : '';
}

module.exports.makeFileNameSafe = makeFileNameSafe;