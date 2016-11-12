/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var credentials = require('./secrets.json');
var bodyParser = require('body-parser');
var twilio = require('twilio');


var client = twilio(credentials.twilio.account_sid, credentials.twilio.auth_token)

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

function sendMessage(target, message) {
    client.sendMessage({
        to: '+xxx',
        from: '+xxx',
        body: 'buttz'
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