const express = require('express')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const router = express.Router()
const { uploadFile } = require('../s3')

router.post('/upload',upload.single('image'), async(req,res)=>{
    const file = req.file
    const info = req.body.description
    console.log("the file info is: ", file)
    try{
        let s3_result = await uploadFile(file)
        console.log(s3_result)
    }
    catch(error){
        console.log(error)
    }
    res.send('success')
})



module.exports = router