function makeFileNameSafe(string){
    return string ? string.replace(/[^a-z0-9.]/gi, '_') : '';
}

function bytesToFileSizeString(bytes){
    var size = bytes;
    var unit = 'b';
    if(bytes < 1000){ // bytes

    }else if(bytes >=1000 && bytes < 1000000){ // kilobytes
        size = (size / 1000).toFixed(2);
        unit = 'kb';
    }else if(bytes >= 1000000 && bytes < 1000000000){ // megabytes
        size = (size / 1000000).toFixed(2);
        unit = 'mb';
    }else{ // gigabytes and beyond
        size = (size / 1000000000).toFixed(2);
        unit = 'gb';
    }
    return `${size}${unit}`;
}

module.exports.makeFileNameSafe = makeFileNameSafe;
module.exports.bytesToFileSizeString = bytesToFileSizeString;