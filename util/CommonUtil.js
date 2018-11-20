const _ = require('lodash')
const uuid = require('uuid')
const path = require('path')
const fs = require('fs')
const ejs = require('ejs')
const wkhtmltopdf = require('wkhtmltopdf')
const wkhtmltoimage = require('wkhtmltoimage')
const ejsExcel = require('ejsexcel')
const format = require('util').format
const Joi = require('joi')
const WebSocket = require('ws')

const config = require('../config')
const Error = require('./Error')
const logger = require('./Logger').createLogger('CommonUtil.js')

// common response
const docValidate = req => {
  let doc = req.body
  if (req.JoiSchema) {
    let result = Joi.validate(doc, req.JoiSchema)
    if (result.error === null) {
      return doc
    } else {
      throw result.error
    }
  } else {
    return doc
  }
}

const reqTrans = (req, callFile) => {
  let method = req.params.method
  let validatorFile = callFile.substring(0, callFile.length - 3) + '.validator.js'
  if (fs.existsSync(validatorFile)) {
    let validator = require(validatorFile)
    if (validator.apiList[method]) {
      let reqJoiSchema = validator.apiList[method].JoiSchema
      if (reqJoiSchema.body) {
        req.JoiSchema = reqJoiSchema.body
      }
    }
  }

  return method
}

// common response
const sendData = (res, data) => {
  if ('WebSocket' in res) {
    res.info = data
  } else {
    let datares = arguments[1] ? arguments[1] : {}
    let sendData = {
      errno: 0,
      msg: 'ok',
      info: datares
    }
    res.send(sendData)
  }
}

const sendError = (res, errno, msg = '错误未配置') => {
  let errnores = arguments[1] ? arguments[1] : -1
  let msgres = arguments[2] ? arguments[2] : 'error'
  if ('WebSocket' in res) {
    res.errno = errnores
    if (errnores in Error) {
      res.msg = Error[errnores]
    } else {
      res.msg = msg
    }
  } else {
    let sendData
    if (errnores in Error) {
      sendData = {
        errno: errnores,
        msg: Error[errnores]
      }
    } else {
      sendData = {
        errno: errnores,
        msg: msg
      }
    }
    res.status(700).send(sendData)
  }
}

const sendFault = (res, msg) => {
  let msgres = arguments[1] ? arguments[1] : 'Internal Error'
  let sendData = {}
  logger.error(msg)

  if ('WebSocket' in res) {
    res.errno = -1
    res.msg = msgres.message
  } else {
    if (process.env.NODE_ENV === 'test') {
      sendData = {
        errno: -1,
        msg: msgres.message
      }
    } else {
      sendData = {
        errno: -1,
        msg: 'Internal Error'
      }
    }
    res.status(500).send(sendData)
  }
}

const generateRandomAlphaNum = len => {
  let charSet = '0123456789'
  let randomString = ''
  for (let i = 0; i < len; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  return randomString
}

const getApiName = path => {
  if (path) {
    let patha = path.split('/')
    let func = patha[patha.length - 1].toUpperCase()
    return func
  } else {
    return ''
  }
}

const buildXML = json => {
  let builder = new xml2js.Builder()
  return builder.buildObject(json)
}

const parseXML = xml => {
  return new Promise(function(resolve, reject) {
    let parser = new xml2js.Parser({
      trim: true,
      explicitArray: false,
      explicitRoot: false
    })
    parser.parseString(xml, function(err, result) {
      if (err) reject(err)
      resolve(result)
    })
  })
}

const generateNonceString = length => {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let maxPos = chars.length
  let noceStr = ''
  for (let i = 0; i < (length || 32); i++) {
    noceStr += chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return noceStr
}

const getUploadTempPath = uploadurl => {
  let fileName = path.basename(uploadurl)
  return path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + fileName)
}

const getUUIDByTime = offset => {
  let uuidStand = uuid.v1()
  let uuidArr = uuidStand.split('-')
  let uuidResult = ''

  for (let i = 0; i < uuidArr.length; i++) {
    uuidResult += uuidArr[i]
  }
  return uuidResult.substring(0, offset)
}

const ejs2File = (templateFile, renderData, options, outputType, res) => {
  return new Promise(function(resolve, reject) {
    try {
      let data = JSON.parse(JSON.stringify(renderData))
      if (!data) {
        data = {}
      }

      let zoom = 1,
        pageSize = 'A4',
        orientation = 'Portrait',
        tempName = uuid.v4().replace(/-/g, '')

      if (options) {
        if (options.zoom) {
          zoom = options.zoom
        }
        if (options.pageSize) {
          pageSize = options.pageSize
        }
        if (options.orientation) {
          orientation = options.orientation
        }
        if (options.name) {
          tempName = options.name
        }
      }

      data.basedir = path.join(__dirname, '../printTemplate')
      let ejsFile = fs.readFileSync(
        path.join(__dirname, '../printTemplate/' + templateFile),
        'utf8'
      )
      let html = ejs.render(ejsFile, data)

      if (options.htmlFlag || outputType === 'htmlurl') {
        let htmlData = data
        fs.writeFileSync(path.join(__dirname, '../', config.tempDir, tempName + '.html'), html)
      }

      if (outputType === 'htmlurl') {
        resolve(config.tmpUrlBase + tempName + '.html')
      } else if (outputType === 'html') {
        res.type('html')
        res.send(html)
      } else if (outputType === 'image') {
        let outSteam = wkhtmltoimage.generate(html, {})
        if (res) {
          res.type('jpg')
          res.set({
            'Content-Disposition': 'attachment; filename=' + tempName + '.jpg'
          })
          outSteam.pipe(res)
          resolve()
        } else {
          let tempFile = tempName + '.jpg'
          outSteam.pipe(fs.createWriteStream(path.join(__dirname, '../', config.tempDir, tempFile)))
          outSteam.on('end', function() {
            resolve(config.tmpUrlBase + tempFile)
          })
        }
      } else if (outputType === 'pdf') {
        let outSteam = wkhtmltopdf(html, {
          zoom: zoom,
          pageSize: pageSize,
          orientation: orientation
        })
        if (res) {
          res.type('pdf')
          res.set({
            'Content-Disposition': 'attachment; filename=' + tempName + '.pdf'
          })
          outSteam.pipe(res)
          resolve()
        } else {
          let tempFile = tempName + '.pdf'
          outSteam.pipe(fs.createWriteStream(path.join(__dirname, '../', config.tempDir, tempFile)))
          outSteam.on('end', function() {
            resolve(config.tmpUrlBase + tempFile)
          })
        }
      } else {
        reject('outputType error')
      }
    } catch (error) {
      reject(error)
    }
  })
}

const ejs2xlsx = (templateFile, renderData, res) => {
  return new Promise(function(resolve, reject) {
    try {
      let templateBuf = fs.readFileSync(path.join(__dirname, '../dumpTemplate/' + templateFile))
      ejsExcel
        .renderExcel(templateBuf, renderData)
        .then(function(exlBuf) {
          let tempName = uuid.v4().replace(/-/g, '') + '.xlsx'
          if (res) {
            res.type('xlsx')
            res.set({
              'Content-Disposition': 'attachment; filename=' + tempName
            })
            res.send(exlBuf)
            resolve()
          } else {
            fs.writeFileSync(path.join(__dirname, '../', config.tempDir, tempName), exlBuf)
            resolve(config.tmpUrlBase + tempName)
          }
        })
        .catch(function(error) {
          reject(error)
        })
    } catch (error) {
      reject(error)
    }
  })
}

const getWSClients = req => {
  let authorization = req.get('authorization')
  let clients = []
  global.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && authorization === client.authorization) {
      clients.push(client)
    }
  })
  return clients
}

const getWSClientsByToken = token => {
  let clients = []
  global.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && token === client.authorization) {
      clients.push(client)
    }
  })
  return clients
}

const wsClientsSend = (clents, msg) => {
  for (let c of clents) {
    c.send(msg)
  }
}

const wsClientsClose = (clents, msg) => {
  for (let c of clents) {
    c.terminate()
  }
}

module.exports = {
  docValidate: docValidate,
  reqTrans: reqTrans,
  sendData: sendData,
  sendError: sendError,
  sendFault: sendFault,
  getUploadTempPath: getUploadTempPath,
  generateRandomAlphaNum: generateRandomAlphaNum,
  getApiName: getApiName,
  buildXML: buildXML,
  parseXML: parseXML,
  generateNonceString: generateNonceString,
  getUUIDByTime: getUUIDByTime,
  ejs2File: ejs2File,
  ejs2xlsx: ejs2xlsx,
  getWSClients: getWSClients,
  wsClientsSend: wsClientsSend,
  getWSClientsByToken: getWSClientsByToken,
  wsClientsClose: wsClientsClose
}
