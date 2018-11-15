const genericPool = require('generic-pool')
const WebSocket = require('ws')

const config = require('../config')
const logger = require('./Logger').createLogger('RPCServerClient')

/**
 * Step 1 - Create pool using a factory object
 */

const opts = {
  max: 10, // maximum size of the pool
  min: 3 // minimum size of the pool
}

const RPCPools = {}
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

        ws.on('error', function error(error) {
          logger.info('%s connected: %s', s, error)
          RPCPools[s].destroy(ws)
        })
      })
    },
    destroy: function(client) {
      client.disconnect()
    }
  }
  RPCPools[s] = genericPool.createPool(factory, config.rpcservers[s].config)
}

/**
 * Step 2 - Use pool in your code to acquire/release resources
 */

// acquire connection - Promise is resolved
// once a resource becomes available
const resourcePromise = myPool.acquire()

resourcePromise
  .then(function(client) {
    client.query('select * from foo', [], function() {
      // return object back to pool
      myPool.release(client)
    })
  })
  .catch(function(err) {
    // handle error - this is generally a timeout or maxWaitingClients
    // error
  })

/**
 * Step 3 - Drain pool during shutdown (optional)
 */
// Only call this once in your application -- at the point you want
// to shutdown and stop using this pool.
myPool.drain().then(function() {
  myPool.clear()
})
