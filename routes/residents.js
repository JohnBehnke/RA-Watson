'use strict'

const router = require('express').Router()
const helpers = require('../helpers')

let db = helpers.establishCloudantConnection()

router.get('/', (req, res) => db.view('people', 'Resident', (err, body) => {
    if (!err) {
        res.send(body.rows)
    } else {
        res.status(500).send(err)
    }
}))

router.get('/:id', (req, res) => db.get(req.params.id, (err, body) => {
    if(err) res.status(500).send(err)
    else    res.status(200).send(body)
}))

router.post('/', (req, res) => {
    console.log(req)

    if(!req.body || !req.body.name || !req.body.phone) {
        res.sendStatus(400)
        return
    }

    const newResident = {
        name: req.body.name,
        phone: req.body.phone,
        type: 'Resident'
    }

    db.insert(newResident, (err, body) => {
        if(err) res.status(500).send(err)
        else res.status(200).send(body)
    })
})

module.exports = router
