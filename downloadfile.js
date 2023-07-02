// const fs = require('fs');
// const client = require('https');

// async function downloadImage(url, filepath) {
//     await client.get(url, (res) => {
//         res.pipe(fs.createWriteStream(filepath));
//     });

    
// }



const fs = require('fs');
const Axios = require('axios')

async function downloadImage(url, filepath) {
    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath)); 
    });
}

module.exports = downloadImage
