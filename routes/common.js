const express = require('express')
const services = require('./service')
const router = express.Router()

// system
router.post('/system/SystemApiControl/:method', services.SystemApiControlSRV.SystemApiControlResource)
router.post('/system/DomainTemplateControl/:method', services.DomainTemplateControlSRV.DomainTemplateControlResource)
router.post('/system/DomainControl/:method', services.DomainControlSRV.DomainControlResource)
router.post('/system/DomainGroupControl/:method', services.DomainGroupControlSRV.DomainGroupControlResource)
router.post('/system/DomainGroupApiControl/:method', services.DomainGroupApiControlSRV.DomainGroupApiControlResource)
router.post('/system/OperatorControl/:method', services.OperatorControlSRV.OperatorControlResource)
router.post('/system/UserSetting/:method', services.UserSettingSRV.UserSettingResource)
router.post('/system/ResetPassword/:method', services.UserResetPasswordSRV.UserResetPasswordResource)

router.post('/test/:method', services.TestSRV.TestResource)
module.exports = router
