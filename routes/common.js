const express = require('express')
const services = require('./service')
const router = express.Router()

//common
//commonQuery
router.post('/components/userSelectDialogControl', services.UserSelectDialogSRV.UserSelectDialogResource)
router.post('/components/DomainSelectDialogControl', services.DomainSelectDialogSRV.DomainSelectDialogResource)

// baseconfig
router.post('/baseconfig/FollowerControl', services.FollowerControlSRV.FollowerControlResource)

// system
router.post('/system/SystemApiControl', services.SystemApiControlSRV.SystemApiControlResource)
router.post('/system/DomainTemplateControl', services.DomainTemplateControlSRV.DomainTemplateControlResource)
router.post('/system/DomainControl', services.DomainControlSRV.DomainControlResource)
router.post('/system/DomainGroupControl', services.DomainGroupControlSRV.DomainGroupControlResource)
router.post('/system/DomainGroupApiControl', services.DomainGroupApiControlSRV.DomainGroupApiControlResource)
router.post('/system/OperatorControl', services.OperatorControlSRV.OperatorControlResource)
router.post('/system/UserSetting', services.UserSettingSRV.UserSettingResource)
router.post('/system/ResetPassword', services.UserResetPasswordSRV.UserResetPasswordResource)

module.exports = router
