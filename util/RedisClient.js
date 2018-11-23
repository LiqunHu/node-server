const common = require('../util/CommonUtil.js')
const logger = require('./Logger').createLogger('RedisClient.js')
const config = require('../config')
const redis = require('redis')
let client = undefined
if (!client) {
  client = redis.createClient(config.redis.port, config.redis.host, config.redis.opts)
}

/**
 * 设置缓存
 * @param key 缓存key
 * @param value 缓存value
 * @param expired 缓存的有效时长，单位秒
 */
exports.setItem = async (key, value, expired) => {
  return new Promise((resolve, reject) => {
    if (expired) {
      client.set(key, JSON.stringify(value), 'EX', expired, function(err, res) {
        if (err) {
          reject(err)
        }
        resolve()
      })
    } else {
      client.set(key, JSON.stringify(value), function(err, res) {
        if (err) {
          reject(err)
        }
        resolve()
      })
    }
  })
}

/**
 * 获取缓存
 * @param key 缓存key
 */
exports.getItem = async key => {
  return new Promise((resolve, reject) => {
    client.get(key, function(err, reply) {
      if (err) {
        reject(err)
      }
      resolve(JSON.parse(reply))
    })
  })
}

/**
 * 获取缓存
 * @param key 缓存key
 */
exports.getLiveTime = key => {
  return new Promise((resolve, reject) => {
    client.ttl(key, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

/**
 * 移除缓存
 * @param key 缓存key
 * @param callback 回调函数
 */
exports.removeItem = async key => {
  return new Promise((resolve, reject) => {
    client.del(key, err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

exports.tokenExpired = parseInt(config.TOKEN_AGE / 1000)
exports.mobileTokenExpired = parseInt(config.MOBILE_TOKEN_AGE / 1000)
exports.SMSTokenExpired = 300
