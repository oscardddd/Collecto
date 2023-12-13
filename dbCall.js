const mysql = require('mysql');
const fs = require('fs');
const ini = require('ini');
// const config = require('./config.js');


const endpoint = process.env.DB_endpoint
const port_number = process.env.port_number
const user_name = process.env.user_name
const user_pwd = process.env.user_pwd
const db_name = process.env.db_name

console.log(endpoint, port_number, user_name, user_pwd, db_name)
//
// creates connection object, but doesn't open connnection:
//

let dbConnection = mysql.createConnection(
  {
    host: endpoint,
    port: port_number,
    user: user_name,
    password: user_pwd,
    database: db_name,
    multipleStatements: true  // allow multiple queries in one call
  }
);

module.exports = dbConnection;