const AppConfig = require('../../../app.config').AppConfig;
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: AppConfig.S3_ID,
    secretAccessKey: AppConfig.S3_SECRET,
});

const broadcasterData = new AppConfig.LRU(100);
var broadcasterList = undefined;

function joinPathForS3(...strings){
    return strings.join('/'); // AWS demands forward slashes
}

function getFileOwner(filePath){
    return filePath ? filePath.split('/')[0] : '???';
}

function clearCacheForBroadcasters(logger, broadcasters){
    broadcasterList = undefined;
    broadcasters.forEach(fileOwner => {
        logger.log(`clearing cache for ${fileOwner}...`)
        if(broadcasterData.has(fileOwner)){
            broadcasterData.get(fileOwner).paths = undefined;
        } 
    });
}

async function uploadFile(logger, fileName, fileContent){
    return new Promise(function(resolve, reject){
        const s3Params = {
            Bucket: AppConfig.S3_BUCKET_NAME,
            Key: fileName, // File name you want to save as in S3
            Body: fileContent
        };
        s3.upload(s3Params, function(err, data) {
            if (err) {
                reject(err);
            }
            logger.log(`File uploaded successfully. ${data.Location}`);
            resolve(data);
        })
    }).then(function(data){
        // clear cache
        const fileOwner = (getFileOwner(fileName));
        clearCacheForBroadcasters(logger, [fileOwner]);
        return { 
            status: 200 
        }
    }).catch(function(err){
        return {
            status: 500,
            message: err
        }
    });
}

async function deleteFiles(logger, filePathList){
    const impactedBroadcasters = new Set();
    return new Promise(function(resolve, reject){
        var s3Params = {
            Bucket: AppConfig.S3_BUCKET_NAME, 
            Delete: {
                Objects: filePathList.map(x => { 
                    impactedBroadcasters.add(getFileOwner(x));
                    return { Key: x }; 
                }),
            }
        };
        s3.deleteObjects(s3Params, (err, data) => {
            if (err){
                reject(err);
            } 
            resolve(data);
        });
    }).then(function(data){
        logger.log(JSON.stringify(data));
        clearCacheForBroadcasters(logger, impactedBroadcasters);
        return {
            status: 200
        };
    }).catch(function(err){
        logger.error(err);
        return {
            status: 500,
            message: err
        };
    });
}

async function getFileList(logger, prefix, resolve, reject){
    const s3params = {
        Bucket: AppConfig.S3_BUCKET_NAME,
        MaxKeys: 20,
        Delimiter: '/',
        Prefix: prefix,
    };
    s3.listObjectsV2 (s3params, (err, data) => {
        if (err) {
            logger.error(err);
            reject(err);
        }
        resolve(data);
    });
}

async function getBroadcasterFolderList(logger){
    if(broadcasterList){
        logger.log('getting broadcaster list from cache');
        return broadcasterList;
    }else{
        return new Promise(function(resolve, reject){
            getFileList(logger, undefined, resolve, reject);
        }).then(function(data){
            broadcasterList = data.CommonPrefixes.map(value => value.Prefix.replace('/', ''))
            return broadcasterList;
        }).catch(function(err){
            logger.error(err);
            return [];
        });
    }
}

async function getFilteredBroadcasterFolderList(logger, searchTerm){
    const completeList = await getBroadcasterFolderList(logger);
    if(!searchTerm){
        return completeList;
    }

    const ratioList = [];
    completeList.forEach((value) => {
        const ratio = AppConfig.FILE_UTILS.fuzzySearch(value, searchTerm)
        if(ratio > 0.0){
            ratioList.push({
                name: value,
                ratio: ratio,
            });
        }
    });

    ratioList.sort((a, b) => { 
        return b.ratio - a.ratio; 
    });

    return ratioList.map(x => x.name);
}

async function getFileListForBroadcaster(logger, broadcaster){
    if(broadcasterData.has(broadcaster) == true && broadcasterData.get(broadcaster).paths){
        logger.log(`getting file list for ${broadcaster} from cache`);
        return broadcasterData.get(broadcaster).paths;
    }else{
        return new Promise(function(resolve, reject){
            getFileList(logger, `${broadcaster}/`, resolve, reject);
        }).then(function(data){
            if(data.Contents){
                const paths = data.Contents.filter(item => item.Size > 0);
                broadcasterData.set(broadcaster, 
                    {
                        allowed: AppConfig.PARTITION_PER_USER_BYTES,
                        used: data.Contents.reduce((acc, curr) => acc + curr.Size, 0),
                        paths: paths,
                    });
                return paths;
            }else{
                return [];
            }
        }).catch(function(err){
            return [];
        });
    }
}

async function getFilteredFileListForBroadcaster(logger, broadcaster, searchTerm){
    const completeList = await getFileListForBroadcaster(logger, broadcaster);
    if(!searchTerm){
        return completeList;
    }

    // TODO: abstract this out somehow
    const ratioList = [];
    completeList.forEach((value) => {
        const ratio = AppConfig.FILE_UTILS.fuzzySearch(value.Key, searchTerm)
        if(ratio > 0.0){
            ratioList.push({
                name: value,
                ratio: ratio,
            });
        }
    });

    ratioList.sort((a, b) => { 
        return b.ratio - a.ratio; 
    });
    return ratioList.map(x => x.name);
}

async function getUsedStorageForBroadcaster(broadcaster){
    if(broadcasterData.has(broadcaster) == true){
        return broadcasterData.get(broadcaster)
    }else{
        console.log('updating used space cache via request...');
        await getFileListForBroadcaster(broadcaster);
        if(broadcasterData.has(broadcaster) == true){
            return broadcasterData.get(broadcaster)
        }else{
            return {
                allowed: 0,
                used: 0
            }
        }
    }
}

async function getFile(logger, filePath, resolve, reject){
    var s3Params = {
        Bucket: AppConfig.S3_BUCKET_NAME, 
        Key: filePath
    };
    s3.getObject(s3Params, (err, data) => {
        if (err) {
            reject(err);
        }  
        resolve(data);
    });
}

async function getFileByPath(logger, filePath){
    logger.log(`GET ${filePath}`);
    return new Promise(function(resolve, reject){
        getFile(logger, filePath, resolve, reject);
    }).then(function(data){
        return data;
    }).catch(function(err){
        logger.error(err);
        return {};
    });
}

function flterAndSort(completeList, searchTerm){}

module.exports.getBroadcasterFolderList = getBroadcasterFolderList;
module.exports.getFilteredBroadcasterFolderList = getFilteredBroadcasterFolderList;
module.exports.getFileListForBroadcaster = getFileListForBroadcaster;
module.exports.getFilteredFileListForBroadcaster = getFilteredFileListForBroadcaster;
module.exports.getUsedStorageForBroadcaster = getUsedStorageForBroadcaster;
module.exports.getFileByPath = getFileByPath;
module.exports.uploadFile = uploadFile;
module.exports.deleteFiles = deleteFiles;
module.exports.joinPathForS3 = joinPathForS3;
module.exports.getFileOwner = getFileOwner;