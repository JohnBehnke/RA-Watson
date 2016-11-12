'use strict';

// Dependencies
var express = require('express');
var credentials = require('./secrets.json');
var bodyParser = require('body-parser');
var twilio = require('twilio');
var cfenv = require('cfenv');

// Initialize Twilio
var client = twilio(credentials.twilio.account_sid, credentials.twilio.auth_token)

// create a new express server
var app = express();
app.use(bodyParser.urlencoded({extended: false}));

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

function sendMessage(target, message) {
    client.sendMessage({
        to: target,
        from: '+xxx',
        body: message
    });
}

app.post('/incoming', function (req, res) {
  console.log(req.body);
})

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});
