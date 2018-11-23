const _ = require('lodash')
const moment = require('moment')
const rp = require('request-promise')

const common = require('../util/CommonUtil.js')
const logger = require('./Logger').createLogger('AuthSRV.js')
const model = require('../model')
const Security = require('../util/Security')
const config = require('../config')
const GLBConfig = require('../util/GLBConfig')
const RedisClient = require('../util/RedisClient')
const sms = require('../util/SMSUtil.js')

// table
const sequelize = model.sequelize
const tb_common_user = model.common_user
const tb_user_groups = model.common_user_groups

const loginInit = async (user, session_token, type) => {
  try {
    let returnData = {}
    returnData.avatar = user.user_avatar
    returnData.user_id = user.user_id
    returnData.username = user.user_username
    returnData.name = user.user_name
    returnData.phone = user.user_phone
    returnData.created_at = moment(user.created_at).format('MM[, ]YYYY')
    returnData.city = user.user_city

    let groups = await tb_user_groups.findAll({
      where: {
        user_id: user.user_id
      }
    })

    if (groups.length > 0) {
      let gids = []
      groups.forEach((item, index) => {
        gids.push(item.usergroup_id)
      })
      returnData.menulist = await iterationMenu(user, gids, '0')

      if (config.redisCache) {
        // prepare redis Cache
        let authApis = []
        if (user.user_type === GLBConfig.TYPE_ADMINISTRATOR) {
          authApis.push({
            api_name: '系统菜单维护',
            api_path: '/common/system/SystemApiControl',
            api_function: 'SYSTEMAPICONTROL',
            auth_flag: '1',
            show_flag: '1'
          })

          authApis.push({
            api_name: '用户设置',
            api_path: '/common/system/UserSetting',
            api_function: 'USERSETTING',
            auth_flag: '1',
            show_flag: '1'
          })

          authApis.push({
            api_name: '角色组维护',
            api_path: '/common/system/GroupControl',
            api_function: 'GROUPCONTROL',
            auth_flag: '1',
            show_flag: '1'
          })

          authApis.push({
            api_name: '员工维护',
            api_path: '/common/system/OperatorControl',
            api_function: 'OPERATORCONTROL',
            auth_flag: '1',
            show_flag: '1'
          })
        } else {
          let groupapis = await queryGroupApi(gids)
          for (let item of groupapis) {
            authApis.push({
              api_name: item.api_name,
              api_path: item.api_path,
              api_function: item.api_function,
              auth_flag: item.auth_flag,
              show_flag: item.show_flag
            })
          }
        }
        let expired = null
        if (type == 'MOBILE') {
          expired = RedisClient.mobileTokenExpired
        } else {
          expired = RedisClient.tokenExpired
        }
        let error = await RedisClient.setItem(
          GLBConfig.REDISKEY.AUTH + type + user.user_id,
          {
            session_token: session_token,
            user: user,
            authApis: authApis
          },
          expired
        )
        if (error) {
          return null
        }
      }

      return returnData
    } else {
      return null
    }
  } catch (error) {
    logger.error(error)
    return null
  }
}

exports.AuthResource = async (req, res) => {
  try {
    common.reqTrans(req, __filename)
    let doc = common.docValidate(req)
    let user

    if (doc.login_type === 'WEB' || doc.login_type === 'MOBILE') {
      if (!('username' in doc)) {
        return common.sendError(res, 'auth_02')
      }
      if (!('identify_code' in doc)) {
        return common.sendError(res, 'auth_03')
      }
      if (!('magic_no' in doc)) {
        return common.sendError(res, 'auth_04')
      }

      user = await tb_common_user.findOne({
        where: {
          user_username: doc.username,
          state: GLBConfig.ENABLE
        }
      })

      if (_.isEmpty(user)) {
        return common.sendError(res, 'auth_05')
      }

      let decrypted = Security.aesDecryptModeCFB(
        doc.identify_code,
        user.user_password,
        doc.magic_no
      )

      if (!(decrypted == user.user_username)) {
        return common.sendError(res, 'auth_05')
      } else {
        let session_token = Security.user2token(
          doc.login_type,
          user,
          doc.identify_code,
          doc.magic_no
        )
        res.append('Authorization', session_token)
        delete user.user_password
        let loginData = await loginInit(user, session_token, doc.login_type)

        if (loginData) {
          loginData.Authorization = session_token
          return common.sendData(res, loginData)
        } else {
          return common.sendError(res, 'auth_05')
        }
      }
    } else if (doc.loginType === 'WEIXIN') {
      if (!('wxCode' in doc)) {
        return common.sendError(res, 'auth_20')
      }

      let wxAuthjs
      if (!('wxAuthjs' in doc)) {
        let url =
          'https://api.weixin.qq.com/sns/jscode2session?appid=' +
          config.weixin.appid +
          '&secret=' +
          config.weixin.app_secret +
          '&js_code=' +
          doc.wxCode +
          '&grant_type=authorization_code'
        let wxAuth = await rp(url)
        logger.info(wxAuth)
        wxAuthjs = JSON.parse(wxAuth)
      } else {
        wxAuthjs = doc.wxAuthjs
      }

      if (wxAuthjs.openid) {
        user = await tb_common_user.findOne({
          where: {
            user_wx_openid: wxAuthjs.openid,
            state: GLBConfig.ENABLE
          }
        })
        if (!user) {
          return common.sendError(res, 'auth_22')
        }
        let session_token = Security.user2token(
          doc.loginType,
          user,
          user.user_wx_openid,
          user.user_username
        )
        user.session_key = wxAuthjs.session_key
        res.append('Authorization', session_token)
        let loginData = await loginInit(user, session_token, doc.loginType)
        if (loginData) {
          loginData.Authorization = session_token
          return common.sendData(res, loginData)
        } else {
          return common.sendError(res, 'auth_05')
        }
      } else {
        return common.sendError(res, 'auth_21')
      }
    } else {
      return common.sendError(res, 'auth_19')
    }
  } catch (error) {
    logger.error(error)
    common.sendFault(res, error)
    return
  }
}

exports.SignOutResource = async (req, res) => {
  try {
    let token_str = req.get('Authorization')
    if (token_str) {
      let tokensplit = token_str.split('-')

      let type = tokensplit[0],
        uid = tokensplit[1],
        magicNo = tokensplit[2],
        expires = tokensplit[3],
        sha1 = tokensplit[4]
      let error = await RedisClient.removeItem(GLBConfig.REDISKEY.AUTH + type + uid)
      if (error) logger.error(error)
    }
    return common.sendData(res)
  } catch (error) {
    logger.error(error)
    return common.sendData(res)
  }
}

exports.SMSResource = async (req, res) => {
  let doc = common.docValidate(req)
  if (!('phone' in doc)) {
    common.sendError(res, 'auth_06')
    return
  }
  if (!('type' in doc)) {
    common.sendError(res, 'auth_07')
    return
  }

  try {
    let result = await sms.sedCodeMsg(doc.phone, doc.type)
    if (result) {
      common.sendData(res)
      return
    } else {
      common.sendError(res, 'auth_08')
      return
    }
  } catch (error) {
    logger.error(error)
    common.sendFault(res, error)
    return
  }
}

exports.PhoneResetPasswordResource = async (req, res) => {
  try {
    let doc = common.docValidate(req),
      user = req.user

    if (!('username' in doc)) {
      common.sendError(res, 'auth_06')
      return
    }
    if (!('type' in doc)) {
      common.sendError(res, 'auth_15')
      return
    }
    if (!('phone' in doc)) {
      common.sendError(res, 'auth_16')
      return
    }
    if (!('code' in doc)) {
      common.sendError(res, 'auth_17')
      return
    }
    if (!('password' in doc)) {
      common.sendError(res, 'auth_18')
      return
    }
    let modUser = await tb_common_user.findOne({
      where: {
        username: doc.username,
        user_type: doc.type,
        state: GLBConfig.ENABLE
      }
    })
    if (!modUser) {
      return common.sendError(res, 'operator_03')
    }
    let checkResult = await sms.certifySMSCode(doc.phone, doc.code, GLBConfig.SMSTYPE[1].value)
    if (checkResult) {
      modUser.password = doc.password
      await modUser.save()
      let retData = JSON.parse(JSON.stringify(modUser))
      common.sendData(res, retData)
    } else return common.sendError(res, 'auth_12')
  } catch (error) {
    return common.sendFault(res, error)
  }
}

const queryGroupApi = async groups => {
  try {
    // prepare redis Cache
    let queryStr = `select DISTINCT c.api_name, c.api_path, c.api_function, c.auth_flag, c.show_flag 
          from tbl_common_usergroupmenu a, tbl_common_systemmenu b, tbl_common_api c
          where a.systemmenu_id = b.systemmenu_id
          and b.api_id = c.api_id
          and a.usergroup_id in (?)
          and b.state = '1'`

    let replacements = [groups]
    let groupmenus = await sequelize.query(queryStr, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    })
    return groupmenus
  } catch (error) {
    logger.error(error)
    return []
  }
}

const iterationMenu = async (user, groups, parent_id) => {
  if (user.user_type === GLBConfig.TYPE_ADMINISTRATOR) {
    let return_list = []
    return_list.push({
      menu_type: GLBConfig.MTYPE_ROOT,
      menu_name: '管理员配置',
      menu_icon: 'fa-cogs',
      show_flag: '1',
      sub_menu: []
    })

    return_list[0].sub_menu.push({
      menu_type: GLBConfig.MTYPE_LEAF,
      menu_name: '系统菜单维护',
      show_flag: '1',
      menu_path: '/common/system/SystemApiControl',
      sub_menu: []
    })

    return_list[0].sub_menu.push({
      menu_type: GLBConfig.MTYPE_LEAF,
      menu_name: '角色组维护',
      show_flag: '1',
      menu_path: '/common/system/GroupControl',
      sub_menu: []
    })

    return_list[0].sub_menu.push({
      menu_type: GLBConfig.MTYPE_LEAF,
      menu_name: '员工维护',
      show_flag: '1',
      menu_path: '/common/system/OperatorControl',
      sub_menu: []
    })

    return return_list
  } else {
    let return_list = []
    let queryStr = `select distinct b.systemmenu_id, b.node_type,b.systemmenu_name,b.systemmenu_icon, c.show_flag, c.api_path
        from tbl_common_usergroupmenu a, tbl_common_systemmenu b
          left join tbl_common_api c on b.api_id = c.api_id
          where a.systemmenu_id = b.systemmenu_id
          and a.usergroup_id in (?)
          and b.parent_id = ?
          order by b.systemmenu_index`

    let replacements = [groups, parent_id]
    let menus = await sequelize.query(queryStr, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    })

    for (let m of menus) {
      let sub_menu = []

      if (m.node_type === GLBConfig.MTYPE_ROOT) {
        sub_menu = await iterationMenu(user, groups, m.systemmenu_id)
      }

      if (m.node_type === GLBConfig.MTYPE_LEAF) {
        return_list.push({
          menu_id: m.systemmenu_id,
          menu_kind: m.api_kind,
          menu_type: m.node_type,
          menu_name: m.systemmenu_name,
          menu_path: m.api_path,
          menu_icon: m.systemmenu_icon,
          show_flag: m.show_flag,
          sub_menu: sub_menu
        })
      } else if (m.node_type === GLBConfig.MTYPE_ROOT && sub_menu.length > 0) {
        return_list.push({
          menu_id: m.systemmenu_id,
          menu_kind: m.api_kind,
          menu_type: m.node_type,
          menu_name: m.systemmenu_name,
          menu_path: m.api_path,
          menu_icon: m.systemmenu_icon,
          show_flag: m.show_flag,
          sub_menu: sub_menu
        })
      }
    }
    return return_list
  }
}
