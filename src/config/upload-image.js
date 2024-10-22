const S3 = require("aws-sdk/clients/s3");
const config = require('./config');
const fs = require('fs');
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

const s3 = new S3({
  region: config.aws.region,
  accessKeyId: config.aws.accessId,
  secretAccessKey: config.aws.secretKey,
});

function uploadFile(file, fileType) {
  const fileStream = fs.createReadStream(file?.path);
  const fileExtension = file.originalname.split('.').pop();
  const uploadParams = {
    Bucket: config.aws.bucketName,
    Body: fileStream,
    Key: `${fileType}/${file.filename}.${fileExtension}`,
  };
  return s3.upload(uploadParams).promise();
}

function uploadFileS3(files) {
  console.log(files)
  if(files?.length) {
    const uploadPromises = files.map(file => {
      return new Promise(async (resolve, reject) => {
        try {
          let fileType = 'other';
          if (file.mimetype.startsWith('image/')) {
            fileType = 'image';
          } else if (file.mimetype.startsWith('video/')) {
            fileType = 'video';
          } else if (file.mimetype.startsWith('audio/')) {
            fileType = 'audio';
          } else if (file.mimetype === 'application/pdf') {
            fileType = 'pdf';
          }
          const imageResponse = await uploadFile(file, fileType);
          console.log('Uploaded image:', imageResponse);
          await unlinkFile(file.path);
          resolve({ success: true, imageURI: imageResponse.Location, fileType });
        } catch (err) {
          console.log("Error uploading file:", err.message);
          resolve({ success: false });
        }
      });
    }); 

    return Promise.all(uploadPromises);
  }else {
    const imageResponse =  uploadFile(files, files.fieldname);
    return imageResponse;
  };
};


module.exports = {
  uploadFileS3,
  uploadFile
};
