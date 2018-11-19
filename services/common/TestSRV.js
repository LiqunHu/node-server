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
    let response = await RPCServer.ServerRequest('pooltest', {
      url: '/common/test',
      method: 'search',
      reqMessage: { a: 1, b: 2 }
    })
    common.sendData(res, response)
  } catch (error) {
    common.sendFault(res, error)
  }
}
