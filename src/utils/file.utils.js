function makeFileNameSafe(string){
    return string ? string.replace(/[^a-z0-9.]/gi, '_') : '';
}

function bytesToFileSizeString(bytes){
    var size = bytes;
    var unit = 'b';
    const interval = 1000;
    if(bytes < interval){ // bytes
        // do nothing!
    }else if(bytes >= interval && bytes < interval * interval){ // kilobytes
        size = (size / (interval)).toFixed(2);
        unit = 'kb';
    }else if(bytes >= interval * interval && bytes < interval * interval * interval){ // megabytes
        size = (size / (interval * interval)).toFixed(2);
        unit = 'mb';
    }else{ // gigabytes and beyond
        size = (size / (interval * interval * interval)).toFixed(2);
        unit = 'gb';
    }
    return `${size}${unit}`;
}

module.exports.makeFileNameSafe = makeFileNameSafe;
module.exports.bytesToFileSizeString = bytesToFileSizeString;