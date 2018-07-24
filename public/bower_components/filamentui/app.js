var express = require('express'),
    http = require('http'),
    fs = require('fs'),
    path = require('path');

// create a new express server
var app = express();

// Create a server
var server = http.createServer(app)

app.use(express.static(path.join(__dirname, 'public')))
// app.use(express.static(path.join(__dirname, 'dist')))

// This route deals enables HTML5Mode by forwarding missing files to the index.html
app.use('/', function (req, res, next) {
    res.sendfile('./public/index.html');
});

var port = (process.env.VCAP_APP_PORT || 8008);

// start server on the specified port and binding host
server.listen(port, function () {
    // print a message when the server starts listening
    console.log("server starting on port " + port);
});
