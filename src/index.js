const express =require("express");
const http = require("http");
const axios = require('axios');
// var con = require("./mysql")
const path = require("path");
const session = require('express-session');
const app =express();
const hbs =require("hbs");
const cookie_parser=require('cookie-parser');

var bodyParser = require('body-parser')
const PORT = process.env.PORT || 3000 ;
const video_streaming_host= process.env.video_streaming_host || "localhost";
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

    //this is for mysql pod
    // host: process.env.MYSQL_HOST || "mysql-service.default.svc",

    //this is for localhost testing
    host: process.env.MYSQL_HOST || "192.168.43.77",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "Aakash8085",
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
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET'
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Set the view engine
  // app.set('view engine', 'ejs');
  
  // Initialize a MySQL connection
  const db = mysql.createConnection({
    host: '192.168.43.77',
    user: 'root',
    password: 'Aakash8085',
    database: 'demodb',
  });
  
  // Passport configuration
  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });
  
  passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
  });
  
  const GOOGLE_CLIENT_ID = '585474362845-eu7rs5qv365maruqpigfgnv6720m64ih.apps.googleusercontent.com';
  const GOOGLE_CLIENT_SECRET = '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';
  
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  ));
  
  // Define your routes
  app.get('/success', (req, res) => {
    res.send(req.user);
  });
  
  app.get('/error', (req, res) => {
    res.send("Error logging in");
  });
  
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }), function(req, res) {
    // This function will be called after the passport.authenticate middleware
  });
  
  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
      // Successful authentication, save user data to the database if it doesn't exist
      const user = req.user;
      console.log("hi ");
      // console.log(req);
      checkAndSaveUserToDatabase(user, (err) => {
        if (err) {
          console.error('Error saving user data to the database:', err);
          res.status(500).send('Error saving user data to the database');
        } else {
          console.log("login success");
          req.session.loggedin = true;
          res.redirect("/browse")
          // res.render("browse");
        }
      });
    });
  
  // Check if a user with the same Google ID already exists in the database
  function checkAndSaveUserToDatabase(user, callback) {
    db.query(
      'SELECT * FROM users WHERE google_id = ?',
      [user.id],
      (err, results) => {
        if (err) {
          callback(err);
        } else if (results.length === 0) {
          // No existing user with the same Google ID, insert the user
          saveUserToDatabase(user, callback);
        } else {
          // User already exists, no need to insert
          callback(null);
        }
      }
    );
  }
  
  // Save user data to the database
  function saveUserToDatabase(user, callback) {
    db.query(
      'INSERT INTO users (google_id, display_name, email, picture_url) VALUES (?, ?, ?, ?)',
      [user.id, user.displayName, user.emails[0].value, user.photos[0].value],
      (err, results) => {
        callback(err);
      }
    );
  }
  
  // Close the database connection when the application exits
  process.on('exit', () => {
    db.end();
  });
  
  // Handle Ctrl+C to gracefully close the database connection
  process.on('SIGINT', () => {
    db.end(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  });
////////////////////////////////////////////////////////////////////////////////
app.get("/login",(req,res) => {
    res.render("login");
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post("/", (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    if (email && password) {
        var sql = `select Name,email,password from customer where email="${email}" and password="${password}"`;

        connection.query(sql, function (err, result) {
            if (err) {
                console.log('Database query failed. ' + err.message);
                return res.status(500).send('Internal Server Error');
            }

            if (result.length <= 0) {
                return res.status(401).render('login', {
                    message: 'Email or Password is incorrect'
                });
            } else {
                var names = {
                    value: `${result[0].Name}`
                };

                if (result.length > 0) {
                    req.session.loggedin = true;
                    req.session.username = names;
                    return res.redirect("/");
                } else {
                    res.send("Incorrect username or password");
                }
            }
        });
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
