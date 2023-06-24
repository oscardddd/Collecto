var pg = require('pg');

module.exports = async function(sql) {
    var conString = process.env.DB_URL;
    var client = new pg.Client(conString);
    try { 
        await client.connect()
        let output;
        if (typeof sql == 'object') {
            output = []
            for (let i=0; i < sql.length; i++) {
                let res = await client.query(sql[i])
                output.push(res.rows);
            }
        } else {
            let res = await client.query(sql)
            output = res.rows;
        }
        await client.end()
        return output;
    } catch (error) {
        console.log(error)
    }
}