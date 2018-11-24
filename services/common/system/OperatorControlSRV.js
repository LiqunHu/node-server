const common = require('../../../util/CommonUtil')
const GLBConfig = require('../../../util/GLBConfig')
const logger = require('../../../util/Logger').createLogger('GroupControlSRV')
const model = require('../../../model')
const RedisClient = require('../../../util/RedisClient')
const Op = model.Op

const tb_usergroup = model.common_usergroup
const tb_user = model.common_user
const tb_user_groups = model.common_user_groups

let groups = []

exports.OperatorControlResource = (req, res) => {
  let method = common.reqTrans(req, __filename)
  if (method === 'init') {
    initAct(req, res)
  } else if (method === 'search') {
    searchAct(req, res)
  } else if (method === 'add') {
    addAct(req, res)
  } else if (method === 'modify') {
    modifyAct(req, res)
  } else if (method === 'delete') {
    deleteAct(req, res)
  } else {
    common.sendError(res, 'common_01')
  }
}

const initAct = async (req, res) => {
  try {
    let returnData = {}

    groups = []
    await genUserGroup('0', 0)
    returnData.groupInfo = groups

    common.sendData(res, returnData)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const searchAct = async (req, res) => {
  try {
    let doc = common.docValidate(req),
      returnData = {}

    let queryStr =
      'select * from tbl_common_user where state = "1" and user_type = "' +
      GLBConfig.TYPE_OPERATOR +
      '"'
    let replacements = []

    if (doc.search_text) {
      queryStr +=
        ' and (user_username like ? or user_email like ? or user_phone like ? or user_name like ? or user_address like ?)'
      let search_text = '%' + doc.search_text + '%'
      replacements.push(search_text)
      replacements.push(search_text)
      replacements.push(search_text)
      replacements.push(search_text)
      replacements.push(search_text)
    }

    let result = await model.queryWithCount(req, queryStr, replacements)

    returnData.total = result.count
    returnData.rows = []

    for (let ap of result.data) {
      ap.user_groups = []
      let user_groups = await tb_user_groups.findAll({
        where: {
          user_id: ap.user_id
        }
      })
      for (let g of user_groups) {
        ap.user_groups.push(g.usergroup_id)
      }
      delete ap.user_password
      returnData.rows.push(ap)
    }

    common.sendData(res, returnData)
  } catch (error) {
    common.sendFault(res, error)
    return
  }
}

const addAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let groupCheckFlag = true

    for (let gid of doc.user_groups) {
      let usergroup = await tb_usergroup.findOne({
        where: {
          usergroup_id: gid
        }
      })
      if (!usergroup) {
        groupCheckFlag = false
        break
      }
    }

    if (groupCheckFlag) {
      let adduser = await tb_user.findOne({
        where: {
          [Op.or]: [{ user_phone: doc.user_phone }, { user_username: doc.user_username }]
        }
      })
      if (adduser) {
        return common.sendError(res, 'operator_02')
      }
      adduser = await tb_user.create({
        user_type: GLBConfig.TYPE_OPERATOR,
        user_username: doc.user_username,
        user_email: doc.user_email,
        user_phone: doc.user_phone,
        user_password: GLBConfig.INITPASSWORD,
        user_name: doc.user_name,
        user_gender: doc.user_gender,
        user_address: doc.user_address,
        user_zipcode: doc.user_zipcode
      })

      for (let gid of doc.user_groups) {
        await tb_user_groups.create({
          user_id: adduser.user_id,
          usergroup_id: gid
        })
      }

      let returnData = JSON.parse(JSON.stringify(adduser))
      delete returnData.user_password
      returnData.user_groups = doc.user_groups
      
      common.sendData(res, returnData)
    } else {
      common.sendError(res, 'operator_01')
      return
    }
  } catch (error) {
    common.sendFault(res, error)
    return
  }
}

const modifyAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let user = req.user

    let modiuser = await tb_user.findOne({
      where: {
        user_id: doc.old.user_id,
        state: GLBConfig.ENABLE
      }
    })
    if (modiuser) {
      modiuser.user_email = doc.new.user_email
      modiuser.user_phone = doc.new.user_phone
      modiuser.user_name = doc.new.user_name
      modiuser.user_gender = doc.new.user_gender
      modiuser.user_avatar = doc.new.user_avatar
      modiuser.user_address = doc.new.user_address
      modiuser.user_state = doc.new.user_state
      modiuser.user_zipcode = doc.new.user_zipcode
      await modiuser.save()

      await tb_user_groups.destroy({
        where: {
          user_id: modiuser.user_id
        }
      })

      for (let gid of doc.new.user_groups) {
        await tb_user_groups.create({
          user_id: modiuser.user_id,
          usergroup_id: gid
        })
      }

      modiuser.user_groups = doc.new.user_groups
      delete modiuser.user_password
      common.sendData(res, modiuser)
      return
    } else {
      common.sendError(res, 'operator_03')
      return
    }
  } catch (error) {
    common.sendFault(res, error)
    return null
  }
}

const deleteAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)

    let deluser = await tb_user.findOne({
      where: {
        user_id: doc.user_id,
        state: GLBConfig.ENABLE
      }
    })

    if (deluser) {
      deluser.state = GLBConfig.DISABLE
      await deluser.save()
      RedisClient.removeItem(GLBConfig.REDISKEY.AUTH + 'WEB' + doc.user_id)
      RedisClient.removeItem(GLBConfig.REDISKEY.AUTH + 'MOBILE' + doc.user_id)
      common.sendData(res)
    } else {
      return common.sendError(res, 'operator_03')
    }
  } catch (error) {
    return common.sendFault(res, error)
  }
}

const genUserGroup = async (parentId, lev) => {
  let actgroups = await tb_usergroup.findAll({
    where: {
      parent_id: parentId,
      usergroup_type: GLBConfig.TYPE_OPERATOR
    }
  })
  for (let g of actgroups) {
    if (g.node_type === GLBConfig.MTYPE_ROOT) {
      groups.push({
        id: g.usergroup_id,
        text: '--'.repeat(lev) + g.usergroup_name,
        disabled: true
      })
      await genUserGroup(g.usergroup_id, lev + 1)
    } else {
      groups.push({
        id: g.usergroup_id,
        text: '--'.repeat(lev) + g.usergroup_name
      })
    }
  }
}
