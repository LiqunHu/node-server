const fs = require('fs');
const path = require('path');
const multiparty = require('multiparty');
const gm = require('gm').subClass({
  imageMagick: true
});
const uuid = require('uuid');

const common = require('../util/CommonUtil.js');
const logger = require('./Logger').createLogger('FileSRV.js');
const config = require('../config');
const MongoCli = require('./MongoClient');

let FileResource = async (req, res) => {
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

function ImageCropperSave(req) {
  return new Promise(function (resolve, reject) {
    if (req.is('multipart/*')) {
      try {
        let form = new multiparty.Form(config.uploadOptions);
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err);
          }
          if (files.cropper_file) {
            let filename = uuid.v4() + '.jpg'
            let cropper_data = JSON.parse(fields.cropper_data[0]);
            if (config.mongoFileFlag) {
              MongoCli.getBucket().then(bucket => {
                let uploadStream = bucket.openUploadStream(filename);
                let outStream = gm(files.cropper_file[0].path)
                  .crop(cropper_data.width, cropper_data.height, cropper_data.x, cropper_data.y)
                  .rotate('white', cropper_data.rotate)
                  .stream('.jpg')
                outStream.on('end', function () {
                  resolve(config.fsUrlBase + filename)
                })

                outStream.on('error', function (err) {
                  reject(err)
                })
                outStream.pipe(uploadStream)
              })
            } else {
              let today = new Date()
              let relPath = 'upload/' + today.getFullYear() + '/' + today.getMonth() + '/' + today.getDate() + '/'
              let svPath = path.join(__dirname, '../' + config.filesDir + '/' + relPath)
              if (!fs.existsSync(svPath)) {
                mkdirssync(svPath)
              }
              gm(files.cropper_file[0].path)
                .setFormat("jpeg")
                .crop(cropper_data.width, cropper_data.height, cropper_data.x, cropper_data.y)
                .rotate('white', cropper_data.rotate)
                .write(path.join(svPath, filename), function (err) {
                  if (!err) resolve(config.fileUrlBase + relPath + filename);
                  reject(err);
                })
            }
          } else {
            reject('no cropper file');
          }
        })
      } catch (error) {
        reject(error);
      }
    } else {
      reject('content-type error');
    }
  })
}

module.exports = {
  FileResource: FileResource,
  ImageCropperSave: ImageCropperSave,
}