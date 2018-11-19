const common = require('../../util/CommonUtil')
const logger = require('../../util/Logger').createLogger('TestSRV')
const config = require('../../config')
const model = require('../../model')
const RPCServer = require('../../util/RPCServerClient')

exports.TestResource = async (method, req) => {
  let res = {}
  if (method === 'search') {
    res = await searchAct(req)
  } else {
    common.sendError(res, 'common_01')
  }
  return res
}

async function searchAct(req) {
  try {
    return { result: 1 }
  } catch (error) {
    return { result: -1 }
  }
}
