const common = require('../../util/CommonUtil')
const logger = require('../../util/Logger').createLogger('TestSRV')
const config = require('../../config')
const model = require('../../model')
const RPCServer = require('../../util/RPCServerClient')

exports.TestResource = async (req, res) => {
  let method = common.reqTrans(req, __filename)
  if (method === 'search') {
    await searchAct(req, res)
  } else {
    common.sendError(res, 'common_01')
  }
}

async function searchAct(req, res) {
  try {
    let doc = common.docValidate(req)
    console.log(doc)
    JSON.parse('{{')
    common.sendData(res, { aaa: 111111 })
  } catch (error) {
    common.sendFault(res, error)
  }
}
