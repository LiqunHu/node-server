const MongoClient = require('mongodb').MongoClient;
const Logger = require('mongodb').Logger;

const config = require('../config');
const Error = require('./Error');
const syslogger = require('./Logger').createLogger('MongoClinet.js');
let db = undefined

if (!db) {
  let connectStr = ''
  if (config.mongo.auth) {
    connectStr = format(config.mongo.connect,
      config.mongo.auth.username, config.mongo.auth.password);
  } else {
    connectStr = config.mongo.connect
  }
  MongoClient.connect(connectStr, {
    useNewUrlParser: true
  }, function (err, client) {
    // Set debug level
    Logger.setLevel('info');

    // Set our own logger
    Logger.setCurrentLogger(function (msg, context) {
      syslogger.debug(msg, context);
    });

    db = client.db(config.mongo.dbName);
  });
}
module.exports = db