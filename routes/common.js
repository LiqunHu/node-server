const express = require('express')
const services = require('./service')
const router = express.Router()

// system
router.post('/system/SystemApiControl/:method', services.SystemApiControlSRV.SystemApiControlResource)
router.post('/system/GroupControl/:method', services.GroupControlSRV.GroupControlResource)
router.post('/system/OperatorControl/:method', services.OperatorControlSRV.OperatorControlResource)
router.post('/system/UserSetting/:method', services.UserSettingSRV.UserSettingResource)
module.exports = router
