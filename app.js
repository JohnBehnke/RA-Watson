'use strict'

// Dependencies
const express = require('express')
const credentials = require('./secrets.json')
const bodyParser = require('body-parser')
const twilio = require('twilio')
const cfenv = require('cfenv')
const watson = require('watson-developer-cloud');
const helpers = require('./helpers')

const conversation = watson.conversation({
    username: credentials.watson.username,
    password: credentials.watson.password,
    version: 'v1',
    version_date: '2016-11-12'
});

// Initialize Twilio
let client = twilio(credentials.twilio.account_sid, credentials.twilio.auth_token)

// create a new express server
let app = express()
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())
    // serve the files out of ./public as our main files
app.use(express.static(`${__dirname}/public`))

let db = helpers.establishCloudantConnection()

// get the app environment from Cloud Foundry
const appEnv = cfenv.getAppEnv()

function sendMessage(target, message) {
    client.sendMessage({
        to: target,
        from: '+xxx',
        body: message
    })
}

app.use('/api', require('./routes'))

app.post('/incoming', (req, res) => {
    console.log(req.body)
    var context = {};
    db.get(req.body.From, function(err, body) {
        if (!err) {
            console.log(body);
            context = body.context
        } else {
            console.log("errrrrrrr girls")
        }
    });





    conversation.message({
        workspace_id: '38c39a3a-7963-4cff-87d7-5242e1ef7d42',
        input: {
            'text': req.body.Body
        },
        context: context
    }, function(err, response) {
        if (err)
            console.log('error:', err);
        else
            console.log(JSON.stringify(response, null, 2));

        if (response.intents[0].intent === 'emergency' && response.intents[0].confidence >= 0.98) {
            console.log("EMERGENCY!")
        }
    });
})

// start server on the specified port and binding host
// print a message when the server starts listening
app.listen(appEnv.port, '0.0.0.0', () => console.log(`server starting on ${appEnv.url}`))