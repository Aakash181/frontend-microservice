const express =require("express");
const http = require("http");
var con = require("./mysql")
const path = require("path");
const app =express();
const hbs =require("hbs");

var bodyParser = require('body-parser')
const PORT = process.env.PORT || 30008 ;
const video_streaming_host= process.env.video_streaming_port || "video-streaming-service";
const video_streaming_port= process.env.video_streaming_host || 30001;
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

//-------------------------------------------------------------
app.get("/",(req,res) => {
    res.render("browse");
});
app.get("/login",(req,res) => {
    res.render("login");
});
app.get("/register",(req,res) => {
    res.render("register");
});
app.get("/browse",(req,res) => {
    res.render("browse");
});

app.get("/tvshow",(req,res) => {
    res.render("tvshow");
});
app.get("/movies",(req,res) => {
    res.render("movies");
});
app.get("/latest",(req,res) => {
    res.render("latest");
});
app.get("/mylist",(req,res) => {
    res.render("mylist");
});

app.get("/single",(req,res) => {
    videoId = req.query.id
    const video = {
        url: `/api/video?id=${videoId}`,
    };
    res.render("single",{video});
});
app.get("/search",(req,res) => {
    res.render("search");
});

app.get("/contact",(req,res) =>{

    res.render("play-video");
    // res.send("hi");
});

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