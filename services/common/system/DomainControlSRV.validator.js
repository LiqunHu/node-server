const Joi = require('joi')

module.exports = {
  name: 'DomainControl Services',
  apiList: {
    init: {
      name: '获取机构数据字典',
      path: '/api/common/system/DomainControl?method=init',
      type: 'post',
      JoiSchema: {
        header: Joi.object().keys({
          Authorization: Joi.string().required()
        })
      }
    }
  }
}