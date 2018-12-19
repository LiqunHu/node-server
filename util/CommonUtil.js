const path = require('path')
const fs = require('fs')
const Joi = require('joi')

const config = require('../app/config')
const Error = require('./Error')
const logger = require('../app/logger').createLogger(__filename)

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
  if ('WebSocket' in res || 'rabbitmq' in res) {
    res.info = data
  } else {
    let sendData = {
      errno: 0,
      msg: 'ok',
      info: data
    }
    res.send(sendData)
  }
}

const sendError = (res, errno) => {
  if ('WebSocket' in res || 'rabbitmq' in res) {
    res.errno = errno
    if (errno in Error) {
      res.msg = Error[errno]
    } else {
      res.msg = '错误未配置'
    }
  } else {
    let sendData
    if (errno in Error) {
      sendData = {
        errno: errno,
        msg: Error[errno]
      }
    } else {
      sendData = {
        errno: errno,
        msg: '错误未配置'
      }
    }
    res.status(700).send(sendData)
  }
}

const sendFault = (res, msg) => {
  let sendData = {}
  logger.error(msg.stack)

  if ('WebSocket' in res || 'rabbitmq' in res) {
    res.errno = -1
    res.msg = msg.stack
  } else {
    if (process.env.NODE_ENV === 'test') {
      sendData = {
        errno: -1,
        msg: msg.stack
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

module.exports = {
  docValidate: docValidate,
  reqTrans: reqTrans,
  sendData: sendData,
  sendError: sendError,
  sendFault: sendFault,
  getUploadTempPath: getUploadTempPath,
  generateRandomAlphaNum: generateRandomAlphaNum,
  getApiName: getApiName,
  generateNonceString: generateNonceString
}
