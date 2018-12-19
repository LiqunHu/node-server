const express = require('express')
const services = require('./service')
const router = express.Router()

router.post('/test/:method', services.TestSRV.TestResource)
module.exports = router
