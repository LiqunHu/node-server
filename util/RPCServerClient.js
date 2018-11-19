const _ = require('lodash')
const genericPool = require('generic-pool')
const WebSocket = require('ws')

const config = require('../config')
const logger = require('./Logger').createLogger('RPCServerClient')

let RPCPools = {}
if (_.isEmpty(RPCPools)) {
  for (let s in config.rpcservers) {
    const factory = {
      create: () => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(
            'ws://' + config.rpcservers[s].host + ':' + config.rpcservers[s].port
          )
          ws.on('open', function open() {
            logger.info('%s connected', s)
            resolve(ws)
          })

          ws.on('close', function close(code, reason) {
            logger.info('%s connected: %d  %s', s, code, reason)
            RPCPools[s].destroy(ws)
          })
        })
      },
      destroy: function(client) {
        ws.terminate()
      }
    }
    RPCPools[s] = {}
    RPCPools[s].pool = genericPool.createPool(factory, config.rpcservers[s].config)
  }
}

// Message
exports.ServerRequest = (server, url, message) => {
  return new Promise((resolve, reject) => {
    RPCPools[server].pool
      .acquire()
      .then(function(ws) {
        const timeoutHandle = setTimeout(function() {
          RPCPools[server].pool.destroy(ws)
          reject({
            errno: -2,
            msg: 'time out',
            info: {}
          })
        }, 5000) // 默认超时时间5s

        function incomingHandler(msg) {
          // logger.info(RPCPools[server].pool.available)
          // logger.info(RPCPools[server].pool.size)
          // logger.info(RPCPools[server].pool.borrowed)
          RPCPools[server].pool.release(ws)
          ws.removeListener('message', incomingHandler)
          clearTimeout(timeoutHandle)
          resolve(JSON.parse(msg))
        }
        ws.on('message', incomingHandler)
        ws.on('error', function error(error) {
          logger.info('%s connected: %s', s, error)
          RPCPools[server].pool.destroy(ws)
          reject(error)
        })
        ws.send(JSON.stringify({ url: url, message: message }))
      })
      .catch(function(err) {
        // handle error - this is generally a timeout or maxWaitingClients
        // error
        console.log(err)
        reject(err)
      })
  })
}
