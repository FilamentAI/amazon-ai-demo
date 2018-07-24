var express = require('express'),
    expressLess = require('express-less'),
    http = require('http'),
    util = require('util'),
    path = require('path'),
    compression = require('compression'),
    RED = require("node-red");

var fs = require('fs');
var bodyParser = require('body-parser');

// create a new express server
var app = express();

// Create a server
var server = http.createServer(app)

app.use(compression({
    filter: shouldCompress
}))

function shouldCompress(req, res) {
    if (req.headers['x-no-compression']) {
        // don't compress responses with this request header 
        return false
    }
    // fallback to standard filter function 
    return compression.filter(req, res)
}

app.use(express.static(path.join(__dirname, 'public')))

app.use('/less/stylesheets/*', function (req, res, next) {
    var url = req.originalUrl;
    var relativePath = url.replace("less/stylesheets/", "");
    var lessCSSFile = './public' + relativePath;
    req.url = lessCSSFile;
    var expressLessObj = expressLess(__dirname, {
        compress: true
    });
    expressLessObj(req, res, next);
});

app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({limit: '20mb'}));
app.use(require('express-session')({
    secret: 'keyboard cat'
}));

// Create the settings object - see default settings.js file for other options
var settings = {
    httpAdminRoot: "/red",
    httpNodeRoot: "/red-api",
    userDir: __dirname + '/nodered/',
    flowFile: "filament_mldemo.json",
    functionGlobalContext: {
        moment : require("moment"),
        momentWeekDay : require("moment-weekday-calc")
    } // enables global context
};

// Initialise the runtime with a server and settings
RED.init(server, settings);

// Serve the editor UI from /red
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

// This route deals enables HTML5Mode by forwarding missing files to the index.html
app.use('/', function (req, res, next) {
    res.sendfile('./public/index.html');
});

var port = (process.env.VCAP_APP_PORT || 6006);

// start server on the specified port and binding host
server.listen(port, function () {
    // print a message when the server starts listening
    console.log("server starting on port " + port);

    // Start the runtime
    RED.start();
});
