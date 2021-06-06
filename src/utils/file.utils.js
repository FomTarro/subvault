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

function getBigrams(string){
    var s = string.toLowerCase()
    var v = s.split('');
    for(var i=0; i<v.length; i++){ v[i] = s.slice(i, i + 2); }
    return v;
  }
  
function fuzzySearch(str1, str2){
    if(str1.length>0 && str2.length>0){
        var pairs1 = getBigrams(str1);
        var pairs2 = getBigrams(str2);
        var union = pairs1.length + pairs2.length;
        var hits = 0;
        for(var x=0; x<pairs1.length; x++){
            for(var y=0; y<pairs2.length; y++){
                if(pairs1[x]==pairs2[y]){
                    hits++;
                }
            }
        }
        if(hits>0){ 
            return ((2.0 * hits) / union);
        }
    }
    return 0.0
}

module.exports.makeFileNameSafe = makeFileNameSafe;
module.exports.bytesToFileSizeString = bytesToFileSizeString;
module.exports.fuzzySearch = fuzzySearch;