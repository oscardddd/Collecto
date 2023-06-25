const express = require('express')
const multer  = require('multer')
const fs = require('fs')

var callDB = require('../dbCall')
const upload = multer({ dest: 'uploads/' })
const router = express.Router()
const { uploadFile, getFileStream, sanitizeFile} = require('../s3')

async function removeFile(dir){
    // let files = fs.readdirSync(dir)
    // files.forEach(file =>{
    //     let filepath = `${dir}/${file}`
    //     try{
    //         fs.unlinkSync(filepath)
    //         console.log("successfully empty uploads")
    //     }
    //     catch(e){
    //         console.log(e)
    //     }
    // })
    await fs.unlinkSync(dir)
    console.log(`successfully empty the uploaded picture at ${dir} `)
    

}


function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

console.log(makeid(5));

router.post('/upload',upload.single('image'), async(req,res)=>{
    const file = req.file
    const info = req.body.description
    console.log("the file info is: ", file)
    let sid = makeid(6)
    try{
        let s3_result = await uploadFile(file)
        console.log(s3_result)
        let sql = `INSERT INTO images(story_id, img_key) 
        VALUES('${sid}', '${s3_result.key}') RETURNING id`;
        
        
        let data = await callDB(sql)
        if (!data || data.length == 0) {
            res.status(404).send("unsuccess")
            console.log("insert image unsuccess")
        } else {
            console.log("successfully insert key")
            res.status(200).send('successfully insert image key')
        }
        await removeFile(file.path)
        console.log(s3_result.key)
        
    }
    catch(error){
        console.log(error)
    }
    // res.send('success')
})

//retrieve image from s3

router.get('/image/:key', (req, res)=>{
    try{
        console.log(req.params)
        const key = req.params.key
        const readStream = getFileStream(key)
        console.log("Trying to retrieve image from s3")
        readStream.pipe(res)
        // res.send("not success")
    }
    catch(e){
        console.log(e)
        res.send("not success")
    }
    
})


router.get('/test123', async (req, res)=>{
    let sid = makeid(6)
    // console.log('random id', sid)
    let sql = `INSERT INTO images(story_id, img_key) 
    VALUES('${sid}', 'ABC') RETURNING id`;
    let data = await callDB(sql)
    if (!data || data.length == 0) {
        res.status(404).send("unsuccess")
    } else {
        res.status(200).send('successfully insert image key')
    }
    

})

router.get('/test', async (req,res)=>{
    res.send("okk")
})

module.exports = router