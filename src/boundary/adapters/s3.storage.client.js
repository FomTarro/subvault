const AppConfig = require('../../../app.config').AppConfig;
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: AppConfig.S3_ID,
    secretAccessKey: AppConfig.S3_SECRET,
});

const usedStorage = new AppConfig.LRU(100);

function joinPathForS3(...strings){
    return strings.join('/');
}

function getFileOwner(filePath){
    return filePath ? filePath.split('/')[0] : '???';
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

async function getFileList(logger, prefix, resolve, reject){
    const s3params = {
        Bucket: AppConfig.S3_BUCKET_NAME,
        MaxKeys: 20,
        Delimiter: '/',
        Prefix: prefix,
    };
    s3.listObjectsV2 (s3params, (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data);
    });
}

async function getBroadcasterFolderList(logger){
    return new Promise(function(resolve, reject){
        getFileList(logger, undefined, resolve, reject);
    }).then(function(data){
        return data.CommonPrefixes.map(value => value.Prefix.replace('/', ''));
    }).catch(function(err){
        logger.error(err);
        return [];
    });
}

async function getFileListForBroadcaster(logger, broadcaster){
    return new Promise(function(resolve, reject){
        getFileList(logger, `${broadcaster}/`, resolve, reject);
    }).then(function(data){
        if(data.Contents){
            usedStorage.set(broadcaster, 
                {
                    allowed: AppConfig.PARTITION_PER_USER_BYTES,
                    used: data.Contents.reduce((acc, curr) => acc + curr.Size, 0),
                });
            return {
                paths: data.Contents.filter(item => item.Size > 0)
            };
        }else{
           return {
               paths: []
            }
        }
    }).catch(function(err){
        return {
            paths: [],
        }
    });
}

async function getUsedStorageForBroadcaster(broadcaster){
    if(usedStorage.get(broadcaster)){
        return usedStorage.get(broadcaster)
    }else{
        console.log('updating used space cache via request...');
        await getFileListForBroadcaster(broadcaster);
        if(usedStorage.has(broadcaster) == true){
            return usedStorage.get(broadcaster)
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

async function deleteFiles(logger, filePathList){
    return new Promise(function(resolve, reject){
        var s3Params = {
            Bucket: AppConfig.S3_BUCKET_NAME, 
            Delete: {
                Objects: filePathList.map(x => { return { Key: x }; }),
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

module.exports.getBroadcasterFolderList = getBroadcasterFolderList;
module.exports.getFileListForBroadcaster = getFileListForBroadcaster;
module.exports.getFileByPath = getFileByPath;
module.exports.uploadFile = uploadFile;
module.exports.deleteFiles = deleteFiles;
module.exports.joinPathForS3 = joinPathForS3;
module.exports.getFileOwner = getFileOwner;
module.exports.getUsedStorageForBroadcaster = getUsedStorageForBroadcaster;