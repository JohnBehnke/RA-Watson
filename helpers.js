const nano = require('nano')
const credentials = require('./secrets.json')

const DB_NAME = 'rawatson'

/**
 * Initializes and returns a connection to the Cloudant database
 * @return {[type]} [description]
 */
exports.establishCloudantConnection = function () {
    return nano(credentials.cloudant.url).db.use(DB_NAME)
}
