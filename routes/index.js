require("../bin/www");
require("../app.js");
var bcrypt = require("bcrypt-nodejs");
var express = require('express');
var router = express.Router();
var sanitizeHTML = require('../sanitizer');
var mysql = require('mysql');
var rand = require("randomstring");

var loginFailure = false;
var posted = false;

csrfs = [];
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'guts'
});

var ipList = {};
var maxRequests = 200;

var loggedInUsers = {};
connection.connect();


function checkUser(req) {
    var requests =  ipList[req.connection.remoteAddress];
    if (requests != null) {
        if (requests > 199) {
            return true;
        } else {
            console.log(requests);
            ipList[req.connection.remoteAddress] = ipList[req.connection.remoteAddress] + 1;
        }
    } else {
        ipList[req.connection.remoteAddress] = 1;
    }
    return false;
}

/* GET home page. */
router.get('/', function(req, res, next) {

    if (checkUser(req))return;
    nocache(req,res,next);
    res.render("index",{})

});

router.get('/index', function(req, res, next) {

    if (checkUser(req))return;
    nocache(req,res,next);
    res.redirect("/")
});

router.get('/login', function(req, res, next) {
    console.log(bcrypt.hashSync("isH57sBxVj6D"));
    console.log(bcrypt.hashSync("xryalmvn"));
    if (checkUser(req))return;
    var csrf = rand.generate();
    var passedVariable = loginFailure;
    loginFailure = false;

    //nocache(req, res, next);
    console.log("request forfinal index" + passedVariable);

    if(passedVariable == false){
        csrfs.push(csrf);
        res.render('login', {"csrf" : csrf});
        return;
    }else{
        csrfs.push(csrf);
        res.render('login', {"csrf" : csrf, "error": "Something went wrong. Are you sure you aren't a dirty hacker?"});
        return;
    }
});


router.get('/about', function(req,res,next){
    if (checkUser(req))return;
    res.render("about",{});
});

router.get('/status', function(req,res,next){
    if (checkUser(req))return;

    connection.query('SELECT message FROM messages ORDER BY id DESC', function (err, results) {
        res.render('status', {rows : results});
    });
});

router.get('/help', function(req,res,next){
    if (checkUser(req))return;
    res.render("help",{});
});

router.post('/dologin', function(req, res, next) {
    if (checkUser(req))return;
  //nocache(req, res, next);
    var username = sanitizeHTML(req.body.username);  // second parameter is default
    var password = req.body.password;
    var csrf = req.body.csrf;


    if((username) != null && (password) != null){
        if (username.length <= 20 && password.length <= 20 && isAlphaNumeric(username) && isAlphaNumeric(password) && csrf.length == 32 && csrfs.indexOf(csrf) != -1) {
            //Check password hash and session cookies
            csrfs.splice(csrfs.indexOf(csrf));
            //Check password hash against database
            connection.query('SELECT username, password FROM users WHERE username = (?)', [username], function (err, results) {
                if(results != null) {
                    for (var i = 0; i < results.length; i++) {

                        var currentHash = results[i]["password"];

                        if (bcrypt.compareSync(password, currentHash)) {
                            var remoteAddress = req.connection.remoteAddress;
                            var sessionID = rand.generate();
                            loggedInUsers[sessionID] = remoteAddress;
                            res.cookie('sessionid', sessionID, {maxAge: 900000, httpOnly: true});
                            res.cookie('username', username, {maxAge: 900000, httpOnly: false});
                            res.redirect("control-panel");
                            return;
                        }
                    }
                }

                loginError(req,res);

            });
        } else {loginError(req,res);}
    } else {loginError(req,res);}
});

router.post('/postupdate', function(req, res, next) {

    if (checkUser(req))return;
    var post = sanitizeHTML(req.body.post);
    console.log(post);
    if (isAlphaNumeric(post) && post.length < 500 && post.length > 1 && csrfs.indexOf(req.body.csrf) != -1) {
        csrfs.splice(csrfs.indexOf(req.body.csrf));
        connection.query("INSERT INTO messages (message) VALUES (?)", [post], function (err, results) {
            console.log(err);
            posted = true;
        });
    }

    res.redirect("control-panel");
});

function loginError(req,res){
    loginFailure = true;
    res.redirect("login");
}
router.get('/admin', function(req, res, next){
    if (checkUser(req))return;
    res.render('admin');
});

router.get('/control-panel',function(req,res,next){
    if (checkUser(req))return;
    if(isValidSession(req)){
        var passedArgument = posted;
        posted = false;

        var csrf = rand.generate();
        csrfs.push(csrf);
        connection.query('SELECT * FROM accounts', function (err, results) {
            //var total = "";
            //for (var i = 0; i < results.length; i++) {
            //
            //    curRes = results[i];
            //    console.log(curRes);
            //    //total += "<td>" + curRes["id"] + "</td><td>" + curRes["firstname"] + "</td><td>" + curRes["surname"] + "</td><td>" + curRes["balance"] + "</td><tr />";
            //
            //}
            //console.log(total);
            if(posted == false) {
                res.render('control-panel', {rows: results, "csrf": csrf});
            }else{
                res.render('control-panel', {rows: results, "csrf": csrf, "postMessage": "Post Successful!"});
            }
        });


    }else{
        res.redirect('login');
    }
});

router.get('/logout',function(req,res,next){
    if (checkUser(req))return;
   if(isValidSession(req)){
       res.clearCookie('sessionid');
       res.clearCookie('username');
       console.log(req.cookies);
       res.redirect('/');
   }else{
       res.redirect('/')
   }
});

function isValidSession(req){
    var cookies = parseCookies(req);

    if (cookies != null && cookies["sessionid"] != null && cookies["sessionid"].length == 32  && loggedInUsers[cookies["sessionid"]] != null && req.connection.remoteAddress == loggedInUsers[cookies["sessionid"]]) {
        return true;
    }

    //Get req'd
    return false;
}

function nocache(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
}

function sanitizeAlphaNumeric(str){
    var result = "";
    var allowed = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ., ";
    for (var i = 0; i < str.length; i++) {
        var currentChar = str[i];
        if (allowed.indexOf(currentChar) != -1) {
           result += str[i];
        }

    }
    return result;
}

function isAlphaNumeric(string){
  if(string == (sanitizeAlphaNumeric(string))){
    return true;
  }

  return false;
}
function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}






module.exports = router;
