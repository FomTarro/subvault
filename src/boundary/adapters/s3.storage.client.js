const AppConfig = require('../../../app.config').AppConfig;
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: AppConfig.S3_ID,
    secretAccessKey: AppConfig.S3_SECRET,
});

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
        return { status: 200 }
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
            return data.Contents.filter(item => item.Size > 0);
        }else{
           return [];
        }
    }).catch(function(err){
        return [];
    });
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

module.exports.getBroadcasterFolderList = getBroadcasterFolderList;
module.exports.getFileListForBroadcaster = getFileListForBroadcaster;
module.exports.getFileByPath = getFileByPath;
module.exports.uploadFile = uploadFile;