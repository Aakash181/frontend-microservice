const express =require("express");
const http = require("http");
// var con = require("./mysql")
const path = require("path");
const session = require('express-session');
const app =express();
const hbs =require("hbs");
const cookie_parser=require('cookie-parser');

var bodyParser = require('body-parser')
const PORT = process.env.PORT || 30008 ;
const video_streaming_host= process.env.video_streaming_host || "video-streaming-service";
const video_streaming_port= process.env.video_streaming_port || 30001;
const partialpath = path.join(__dirname,"../templates/partials");
const staticpath = path.join(__dirname,"../public");

app.set('view engine', 'hbs');
app.set('views','./templates/views')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true }));


hbs.registerPartials(partialpath);
app.use("/mycss",express.static(path.join(__dirname,"../public/css")))
app.use("/lib",express.static(path.join(__dirname,"../public/lib")))
app.use("/images",express.static(path.join(__dirname,"../public/images")))
app.use("/css",express.static(path.join(__dirname,"../node_modules/bootstrap/dist/css")));
app.use("/js",express.static(path.join(__dirname,"../node_modules/bootstrap/dist/js")));
app.use("/public-js",express.static(path.join(__dirname,"../public/js")));

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

//----------------------------------------------
//------------Mysql database--------------------

const mysql = require('mysql2');
const { json } = require("body-parser");
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST || "mysql-service.default.svc",
    // host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "YOUR-PASSWORD",
    // password: process.env.MYSQL_PASSWORD || "YOUR-PASSWORD",
    database: process.env.MYSQL_DATABASE || "demodb"
});

connection.connect((err) => {
    if (err) {
        console.log('Database connection failed. ' + err.message)
    } else {
        console.log('Database connected.')
    }
});
//-------------------------------------------------------------
app.get("/login",(req,res) => {
    res.render("login");
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post("/",(req,res) =>{
    // console.log(req.body)
    var email = req.body.email;
    var password= req.body.password;
    if(email && password)
    {
        var sql = `select Name,email,password from customer where email="${email}" and password="${password}"`;
        // console.log(sql);
        connection.query(sql,function(err,result) {
            if (err== null && result.length<=0) {
                return res.status(401).render('login', {
                    message: 'Email or Password is incorrect'
                })
                res.end;
            }
            else
            {
                // if (err) throw new Error('database failed to connect');
                var data=JSON.parse(JSON.stringify(result))
                const names ={
                    value: `${data[0].Name}`
                }
    
                if(result.length >0)
                {
                    req.session.loggedin = true;
                    req.session.username =names;
                    // return res.render("browse",{names});
                    return res.redirect("/");
                    // res.end();
                }                
                else{
                    // res.render("login");
                    res.send("incorrect username or password");
                }
                // res.end();
                
            }

        })

    }
});

app.get("/",(req,res) => {
    if (req.session.loggedin) {
        // const name=req.session.username;
        names = req.session.username;
        res.render("browse",{names});
    }
    else{
        res.render("login"); 
    }
      
    
});
app.get("/register",(req,res) => {
    res.render("register");
});
app.get("/browse",(req,res) => {
    if(req.session.loggedin){
        // const names=req.session.username;
        res.render("browse");
    }
    else{
        res.render("login");
    }
});

app.get("/tvshow",(req,res) => {
    // const names = req.session.username;
    if (req.session.loggedin) {
        const names=req.session.username;
        res.render("tvshow",{names});
    }
    else
    res.render("tvshow");
});
app.get("/movies",(req,res) => {
    const names=req.session.username;
    if(req.session.loggedin)
        res.render("movies",{names});
    else
        res.render("login");
});
app.get("/latest",(req,res) => {
    const names=req.session.username;
    if(req.session.loggedin)
    res.render("latest",{names});
});
app.get("/mylist",(req,res) => {
    const names=req.session.username
    if(req.session.loggedin)
        res.render("mylist",{names});
    else
        res.render("login");    
});
app.get("/upload",(req,res)=>{
    res.render("upload");
})

app.get("/single",(req,res) => {
    if(req.session.loggedin)
    {
        videoId = req.query.id
        console.log(videoId)
        const video = {
            url: `/api/video?id=${videoId}`,
        };
        res.render("single",{video});
    }
});
app.get("/search",(req,res) => {
    res.render("search");
});

app.get("/contact",(req,res) =>{

    res.render("play-video");
    // res.send("hi");
});
app.get("/sign_out",(req,res) =>{
    req.session.loggedin= false;
    res.redirect("/");
})
// HTTP GET API to stream video to the user's browser.

app.get("/api/video", (req, res) => {
    console.log("yaa got it");
    const forwardRequest = http.request( // Forward the request to the video streaming microservice.
        {
            host: `${video_streaming_host}`,
            path: `/video?id=${req.query.id}`,
            port: `${video_streaming_port}`,
            method: 'GET',
        }, 
        forwardResponse => {
            res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
            forwardResponse.pipe(res);
        }
    );
    
    req.pipe(forwardRequest);
});
 
app.listen(PORT, () => {
    console.log(`microservice online at port no ${PORT}`);
});