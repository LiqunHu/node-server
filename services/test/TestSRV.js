const rabbitmqClinet = require('server-utils').rabbitmqClinet
const wsUtil = require('server-utils').websocketUtil
const smsClient = require('server-utils').smsClient
const common = require('../../util/CommonUtil')
const logger = require('../../app/logger').createLogger(__filename)

exports.TestResource = (req, res) => {
  let method = common.reqTrans(req, __filename)
  logger.debug(method)
  if (method === 'search') {
    searchAct(req, res)
  } else if (method === 'search2') {
    search2Act(req, res)
  } else if (method === 'search3') {
    search3Act(req, res)
  } else if (method === 'search4') {
    search4Act(req, res)
  } else {
    common.sendError(res, 'common_01')
  }
}

const searchAct = async (req, res) => {
  try {
    common.sendData(res, { aaaa: 1111 })
  } catch (error) {
    common.sendFault(res, error)
  }
}

const search2Act = async (req, res) => {
  try {
    let response = await wsUtil.serverRequest('pooltest', '/common/test/search', { a: 1, b: 2 })
    common.sendData(res, response)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const search3Act = async (req, res) => {
  try {
    await rabbitmqClinet.sendToQueue('test', '/common/test/search', { a: 1, b: 2 })
    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const search4Act = async (req, res) => {
  try {
    smsClient.sendMessage('18698729476', '这是个测试短信')
    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}
