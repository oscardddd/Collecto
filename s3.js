require('dotenv').config()
const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')

const bucketName = process.env.AWS_BUCKET_NAME
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const region = process.env.AWS_BUCKET_REGION


const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})
//upload a file to s3
function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)
  
    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: file.filename
    }
  
    return s3.upload(uploadParams).promise()
  }

exports.uploadFile = uploadFile

//download a file from s3

function getFileStream(fileKey) {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }
  
    return s3.getObject(downloadParams).createReadStream()
  }
exports.getFileStream = getFileStream