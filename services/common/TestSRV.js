const common = require('../../util/CommonUtil')
const logger = require('../../util/Logger').createLogger('TestSRV')
const config = require('../../config')
const model = require('../../model')
const RPCServer = require('../../util/RPCServerClient')

exports.TestResource = (req, res) => {
  let method = common.reqTrans(req, __filename)
  if (method === 'search') {
    searchAct(req, res)
  } else {
    common.sendError(res, 'common_01')
  }
}

async function searchAct(req, res) {
  try {
    let response = await RPCServer.ServerRequest('pooltest', { 11: 11 })
    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}
