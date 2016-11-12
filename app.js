'use strict';

// Dependencies
const express = require('express')
const credentials = require('./secrets.json')
const bodyParser = require('body-parser')
const twilio = require('twilio')
const cfenv = require('cfenv')

// Initialize Twilio
let client = twilio(credentials.twilio.account_sid, credentials.twilio.auth_token)

// create a new express server
let app = express()
app.use(bodyParser.urlencoded({ extended: false }))

// serve the files out of ./public as our main files
app.use(express.static(`${__dirname}/public`))

// get the app environment from Cloud Foundry
const appEnv = cfenv.getAppEnv()

function sendMessage(target, message) {
    client.sendMessage({
        to: target,
        from: '+xxx',
        body: message
    })
}

app.post('/incoming', (req, res) => {
  console.log(req.body);
})

// start server on the specified port and binding host
// print a message when the server starts listening
app.listen(appEnv.port, '0.0.0.0', () => console.log(`server starting on ${appEnv.url}`));
