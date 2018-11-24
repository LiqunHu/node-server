const fs = require('fs')
const path = require('path')
const multiparty = require('multiparty')
const gm = require('gm').subClass({
  imageMagick: true
})
const uuid = require('uuid')
const mime = require('mime-types')
const moment = require('moment')

const common = require('../util/CommonUtil.js')
const logger = require('./Logger').createLogger('FileSRV.js')
const config = require('../config')
const MongoCli = require('./MongoClient')

const FileResource = async (req, res) => {
  try {
    let fileName = req.params.filetag

    let bucket = await MongoCli.getBucket()
    let downloadStream = bucket.openDownloadStreamByName(fileName)

    res.type(req.params.filetag)
    downloadStream.pipe(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const ImageCropperSave = req => {
  return new Promise((resolve, reject) => {
    if (req.is('multipart/*')) {
      try {
        let form = new multiparty.Form(config.uploadOptions)
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err)
          }
          if (files.cropper_file) {
            let filename = uuid.v1() + '.jpg'
            let cropper_data = JSON.parse(fields.cropper_data[0])
            if (config.mongoFileFlag) {
              MongoCli.getBucket().then(bucket => {
                let uploadStream = bucket.openUploadStream(filename)
                let outStream = gm(files.cropper_file[0].path)
                  .crop(cropper_data.width, cropper_data.height, cropper_data.x, cropper_data.y)
                  .rotate('white', cropper_data.rotate)
                  .stream('.jpg')
                outStream.on('end', () => {
                  resolve(config.fsUrlBase + filename)
                })

                outStream.on('error', err => {
                  reject(err)
                })
                outStream.pipe(uploadStream)
              })
            } else {
              let today = new Date()
              let relPath = 'upload/' + moment().format('YYYY/MM/DD/')
              let svPath = path.join(__dirname, '../' + config.filesDir + '/' + relPath)
              if (!fs.existsSync(svPath)) {
                let result = fs.mkdirSync(svPath, { recursive: true })
                if (result) {
                  reject(result)
                }
              }
              gm(files.cropper_file[0].path)
                .setFormat('jpeg')
                .crop(cropper_data.width, cropper_data.height, cropper_data.x, cropper_data.y)
                .rotate('white', cropper_data.rotate)
                .write(path.join(svPath, filename), err => {
                  if (!err) resolve(config.fileUrlBase + relPath + filename)
                  reject(err)
                })
            }
          } else {
            reject('no cropper file')
          }
        })
      } catch (error) {
        reject(error)
      }
    } else {
      reject('content-type error')
    }
  })
}

const fileSave = req => {
  return new Promise((resolve, reject) => {
    if (req.is('multipart/*')) {
      try {
        let form = new multiparty.Form(config.uploadOptions)
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err)
          }
          if (files.file) {
            let ext = path.extname(files.file[0].path)
            let filename = uuid.v1() + ext
            if (config.mongoFileFlag) {
              MongoCli.getBucket().then(bucket => {
                let uploadStream = bucket.openUploadStream(filename)
                let readStream = fs.createReadStream(files.file[0].path)
                readStream.on('end', () => {
                  fs.unlinkSync(files.file[0].path)
                  resolve({
                    name: files.file[0].originalFilename,
                    ext: ext,
                    url: config.fsUrlBase + filename,
                    type: mime.lookup(path.extname(files.file[0].path))
                  })
                })

                readStream.on('error', err => {
                  reject(err)
                })
                readStream.pipe(uploadStream)
              })
            } else {
              let relPath = 'upload/' + moment().format('YYYY/MM/DD/')
              let svPath = path.join(__dirname, '../' + config.filesDir + '/' + relPath)
              if (!fs.existsSync(svPath)) {
                let result = fs.mkdirSync(svPath, { recursive: true })
                if (result) {
                  reject(result)
                }
              }
              fs.renameSync(files.file[0].path, path.join(svPath, filename))
              resolve({
                name: files.file[0].originalFilename,
                ext: ext,
                url: config.fileUrlBase + relPath + filename,
                type: mime.lookup(path.extname(files.file[0].path))
              })
            }
          } else {
            reject('no file')
          }
        })
      } catch (error) {
        reject(error)
      }
    } else {
      reject('content-type error')
    }
  })
}

const fileDeleteByUrl = url => {
  return new Promise((resolve, reject) => {
    let fileSys = url.substring(0, config.fsUrlBase.length)
    if (fileSys === config.fsUrlBase) {
      MongoCli.getBucket().then(bucket => {
        let fileName = url.substring(config.fsUrlBase.length, url.length)
        bucket
          .find({ filename: url.substring(config.fsUrlBase.length, url.length) })
          .toArray((err, docs) => {
            if (err) {
              reject(err)
            }
            bucket.delete(docs[0]._id, (err, result) => {
              if (err) {
                reject(err)
              }
              resolve()
            })
          })
      })
    } else {
      let relPath = url.substring(config.fileUrlBase.length, url.length)
      let filePath = path.join(__dirname, '../' + config.filesDir + '/' + relPath)
      let err = fs.unlinkSync(filePath)
      if (err) {
        reject(err)
      }
      resolve()
    }
  })
}

const fileSaveTemp = req => {
  return new Promise((resolve, reject) => {
    if (req.is('multipart/*')) {
      try {
        let form = new multiparty.Form(config.uploadOptions)
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err)
          }
          if (files.file) {
            resolve({
              name: files.file[0].originalFilename,
              ext: path.extname(files.file[0].path),
              url: config.tmpUrlBase + files.file[0].name,
              type: mime.lookup(path.extname(files.file[0].path))
            })
          } else {
            reject('no file')
          }
        })
      } catch (error) {
        reject(error)
      }
    } else {
      reject('content-type error')
    }
  })
}

const fileMove = url => {
  return new Promise((resolve, reject) => {
    let fileSys = url.substring(0, config.tmpUrlBase.length)
    if (fileSys === config.tmpUrlBase) {
      let ext = path.extname(url)
      let tempName = path.basename(url)
      let tempfile = path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + tempName)
      let filename = uuid.v1() + ext
      if (config.mongoFileFlag) {
        MongoCli.getBucket().then(bucket => {
          let uploadStream = bucket.openUploadStream(filename)
          let readStream = fs.createReadStream(tempfile)
          readStream.on('end', () => {
            fs.unlinkSync(tempfile)
            resolve({
              url: config.fsUrlBase + filename
            })
          })

          readStream.on('error', err => {
            reject(err)
          })
          readStream.pipe(uploadStream)
        })
      } else {
        let relPath = 'upload/' + moment().format('YYYY/MM/DD/')
        let svPath = path.join(__dirname, '../' + config.filesDir + '/' + relPath)
        if (!fs.existsSync(svPath)) {
          let result = fs.mkdirSync(svPath, { recursive: true })
          if (result) {
            reject(result)
          }
        }
        fs.renameSync(tempfile, path.join(svPath, filename))
        resolve({
          url: config.fileUrlBase + relPath + filename
        })
      }
    } else {
      reject('url error')
    }
  })
}

module.exports = {
  FileResource: FileResource,
  ImageCropperSave: ImageCropperSave,
  fileSave: fileSave,
  fileDeleteByUrl: fileDeleteByUrl,
  fileSaveTemp: fileSaveTemp,
  fileMove: fileMove
}
