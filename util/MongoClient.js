const MongoClient = require('mongodb').MongoClient
const GridFSBucket = require('mongodb').GridFSBucket
const ObjectID = require('mongodb').ObjectID
const Logger = require('mongodb').Logger

const config = require('../config')
const Error = require('./Error')
const syslogger = require('./Logger').createLogger('MongoClinet.js')
let db = undefined

const getDb = async () => {
  if (db) {
    return db
  } else {
    let connectStr = ''
    if (config.mongo.auth) {
      connectStr = format(
        config.mongo.connect,
        config.mongo.auth.username,
        config.mongo.auth.password
      )
    } else {
      connectStr = config.mongo.connect
    }
    let client = await MongoClient.connect(
      connectStr,
      {
        useNewUrlParser: true
      }
    )
    // Set debug level
    Logger.setLevel('info')

    // Set our own logger
    Logger.setCurrentLogger((msg, context) => {
      syslogger.debug(msg, context)
    })

    db = client.db(config.mongo.dbName)
    return db
  }
}

const getBucket = async () => {
  let db = await getDb()
  let bucket = new GridFSBucket(db, { bucketName: config.mongo.bucketName })
  return bucket
}

const genObjectID = () => {
  let fileId = new ObjectID()
  return fileId
}

module.exports = {
  getDb: getDb,
  getBucket: getBucket,
  genObjectID: genObjectID
}
