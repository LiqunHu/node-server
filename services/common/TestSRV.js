const common = require('../../util/CommonUtil')
const logger = require('../../util/Logger').createLogger('TestSRV')
const config = require('../../config')
const model = require('../../model')
const RPCServer = require('../../util/RPCServerClient')

exports.TestResource = (req, res) => {
  let method = common.reqTrans(req, __filename)
  if (method === 'search') {
    searchAct(req, res)
  } else if (method === 'search2') {
    search2Act(req, res)
  } else {
    common.sendError(res, 'common_01')
  }
}

const searchAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    common.sendData(res, { aaaa: 1111 })
  } catch (error) {
    common.sendFault(res, error)
  }
}

const search2Act = async (req, res) => {
  try {
    let response = await RPCServer.ServerRequest('pooltest', '/common/test/search', { a: 1, b: 2 })
    common.sendData(res, response)
  } catch (error) {
    common.sendFault(res, error)
  }
}
