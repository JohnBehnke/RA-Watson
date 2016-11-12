'use strict';

const express = require('express')
const path = require('path')
const fs = require("fs")

let router = express.Router()
let files  = fs.readdirSync(path.resolve('routes'))

for(const f of files) {
    if(f !== 'index.js') {
        router.use(`/${f.split('.')[0]}`, require(path.resolve(`routes/${f}`)))
    }
}

module.exports = router
