const Joi = require('joi')

module.exports = {
  name: 'Auth Services',
  apiList: {
    Auth: {
      name: '登陆授权',
      enname: 'Auth',
      tags: ['Auth'],
      path: '/api/auth',
      type: 'post',
      JoiSchema: {
        body: Joi.object().keys({
          login_type: Joi.any().allow('WEB', 'MOBILE'),
          username: Joi.string().max(100),
          identify_code: Joi.string().max(100),
          magic_no: Joi.string().max(100)
        })
      }
    }
  }
}
