const fs = require('fs');
const path = require('path');

const common = require('../util/CommonUtil.js');
const logger = require('./Logger').createLogger('FileSRV.js');
const MongoCli = require('./MongoClient');

exports.FileResource = async (req, res) => {
  try {
    let fileName = req.params.filetag
    let ext = path.extname(fileName)

    let bucket = await MongoCli.getBucket()
    let downloadStream = bucket.openDownloadStreamByName(fileName)

    res.type(req.params.filetag)
    downloadStream.pipe(res)
  } catch (error) {
    common.sendFault(res, error);
  }
};