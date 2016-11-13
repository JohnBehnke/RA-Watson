'use strict'

// Dependencies
const express = require('express')
const credentials = require('./secrets.json')
const bodyParser = require('body-parser')
const twilio = require('twilio')
const cfenv = require('cfenv')
const watson = require('watson-developer-cloud');
const helpers = require('./helpers')

const WATSON_WORKSPACE = '38c39a3a-7963-4cff-87d7-5242e1ef7d42'

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

let numbersAwaitingName = []
let backloggedQuestions = {}

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

    const numberIndex = numbersAwaitingName.indexOf(req.body.From)

    if(numberIndex !== -1 && req.body.Body.search(/[a-zA-Z .'-]+, ([0-9])+/) != -1) {
        let components = req.body.Body.split(',')

        conversation.message({
            workspace_id: WATSON_WORKSPACE,
            input: {
                'text': backloggedQuestions[req.body.From]
            }
        }, function(err, response) {
            if (err) {
                console.log('error:', err)
                return
            }

            console.log(JSON.stringify(response, null, 2))

            const newResident = {
                name: components[0].trim(),
                roomNum: components[1].trim(),
                context: response.context,
                type: 'Resident'
            }

            db.insert(newResident, req.body.From, (err, body) => {
                if(err) console.error(err)
            })

            let messageToSend = ''

            if(response.intents[0].intent === 'greeting') {
                messageToSend = 'Okay, thank you! I have your number saved now!'
            } else {
                messageToSend = response.output.text
            }

            client.sendMessage({
                to: req.body.From,
                from: req.body.To,
                body: messageToSend
            })

            if (response.intents[0].intent === 'emergency' && response.intents[0].confidence >= 0.98) {
                console.log("EMERGENCY!")
            }
        })

        numbersAwaitingName.splice(numberIndex, 1)
        delete backloggedQuestions[req.body.From]

        return
    } else {
        var context = {}

        db.get(req.body.From, function(err, body) {
            if (!err) {
                console.log(body);
                context = body.context

                conversation.message({
                    workspace_id: WATSON_WORKSPACE,
                    input: {
                        'text': req.body.Body
                    },
                    context: context
                }, function(err, response) {
                    if (err)
                        console.log('error:', err)
                    else
                        console.log(JSON.stringify(response, null, 2))

                    db.insert({ _id: body._id, _rev: body._rev, context: response.context }, (err, innerBody) => {
                        if(err) console.error(err)
                    })

                    client.sendMessage({
                        to: req.body.From,
                        from: req.body.To,
                        body: response.output.text
                    })

                    if (response.intents[0].intent === 'emergency' && response.intents[0].confidence >= 0.98) {
                        console.log("EMERGENCY!")
                    }
                })
            } else {
                if(numbersAwaitingName.indexOf(req.body.From) === -1) {
                    numbersAwaitingName.push(req.body.From)
                    backloggedQuestions[req.body.From] = req.body.Body
                }

                client.sendMessage({
                    to: req.body.From,
                    from: req.body.To,
                    body: "I don't recognize your phone! Can you send me your name and room number? (like this, \"First Last, Room Number\")"
                })
            }
        })
    }
})

// start server on the specified port and binding host
// print a message when the server starts listening
app.listen(appEnv.port, '0.0.0.0', () => console.log(`server starting on ${appEnv.url}`))
