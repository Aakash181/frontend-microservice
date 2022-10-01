/* var mysql = require('mysql');  
var con = mysql.createConnection({  
  host: "127.0.0.0://mysql-service:3306",  
  user: "root",  
  password: "password"});  
con.connect(function(err) {  
  if (err) throw err;  
  console.log("Connected!");  
});*/

const mysql = require('mysql')

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST || "mysql-service.default.svc",
//    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "password",
    database: process.env.MYSQL_DATABASE || "demodb"
});

connection.connect((err) => {
    if (err) {
        console.log('Database connection failed. ' + err.message)
    } else {
        console.log('Database connected.')
        var sql = "insert into customer(Name,Mobile,email) VALUES ('ROHAN',6264311284,'Rohan@gmail.com')";
        connection.query(sql,function(err,result){
            if (err) throw err;
            console.log("1 record inserted");
        })
    }
});