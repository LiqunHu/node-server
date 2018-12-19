const _ = require('lodash')
const config = require('./config')
const elasticsearch = require('elasticsearch')
let client = null
if (!_.isEmpty(config.elasticsearch)) {
  if (!client) {
    client = new elasticsearch.Client({
      host: config.elasticsearch.host,
      log: config.elasticsearch.log
    })
  }
}

module.exports = client
