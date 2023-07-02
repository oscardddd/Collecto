require('dotenv').config()
const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')

const bucketName = process.env.AWS_BUCKET_NAME
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const region = process.env.AWS_BUCKET_REGION

//make sure the file submitted is an image
function sanitizeFile(file) {
  // Define the allowed extension
  const fileExts = [".png", ".jpg", ".jpeg", ".gif"];

  // Check allowed extensions
  const isAllowedExt = fileExts.includes(
      path.extname(file.originalname.toLowerCase())
  );

  // Mime type must be an image
  // const isAllowedMimeType = file.mimetype.startsWith("image/");

  if (isAllowedExt) {
      console.log("file type correct ");
      next();
       // no errors
  } else {
      // pass error msg to callback, which can be displaye in frontend
      console.log("Error: File type not allowed!");
  }
}

exports.sanitizeFile = sanitizeFile



const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})
//upload a file to s3
function uploadFile(file) { 
    console.log(file)
    const fileStream = fs.createReadStream(file.path)
  
    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: file.filename
    }
  
    return s3.upload(uploadParams).promise()
  }

exports.uploadFile = uploadFile


function uploadFile2(filepath, key) { 
  
  const fileStream = fs.createReadStream(filepath)
  // console.log(fileStream)

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: key
  }

  return s3.upload(uploadParams).promise()
}
exports.uploadFile2 = uploadFile2


//download a file from s3

function getFileStream(fileKey) {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }
  
    return s3.getObject(downloadParams).createReadStream()
  }
exports.getFileStream = getFileStream
