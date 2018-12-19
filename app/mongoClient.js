const _ = require('lodash')
const MongoClient = require('mongodb').MongoClient
const GridFSBucket = require('mongodb').GridFSBucket
const ObjectID = require('mongodb').ObjectID

const config = require('./config')
let db = null

const getDb = async () => {
  if (db) {
    return db
  } else {
    if (!_.isEmpty(config.mongo)) {
      let client = await MongoClient.connect(
        config.mongo.url,
        config.mongo.options
      )

      db = client.db(config.mongo.dbName)
      return db
    }
  }
}

const getBucket = async () => {
  let db = await getDb()
  if(_.isNull(db)) {
    throw new Error('Do not connected')
  }
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
