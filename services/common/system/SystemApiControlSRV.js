const common = require('../../../util/CommonUtil')
const GLBConfig = require('../../../util/GLBConfig')
const logger = require('../../../util/Logger').createLogger('GroupControlSRV')
const model = require('../../../model')

// tables
const tb_common_systemmenu = model.common_systemmenu
const tb_common_api = model.common_api

exports.SystemApiControlResource = (req, res) => {
  let method = common.reqTrans(req, __filename)
  if (method === 'init') {
    initAct(req, res)
  } else if (method === 'search') {
    searchAct(req, res)
  } else if (method === 'addFolder') {
    addFolderAct(req, res)
  } else if (method === 'modifyFolder') {
    modifyFolderAct(req, res)
  } else if (method === 'addMenu') {
    addMenuAct(req, res)
  } else if (method === 'modifyMenu') {
    modifyMenuAct(req, res)
  } else if (method === 'getApi') {
    getApiAct(req, res)
  } else {
    common.sendError(res, 'common_01')
  }
}

const initAct = async (req, res) => {
  try {
    let user = req.user,
      returnData = {
        authInfo: GLBConfig.AUTHINFO,
        tfInfo: GLBConfig.TFINFO
      }

    common.sendData(res, returnData)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const searchAct = async (req, res) => {
  try {
    let user = req.user
    let menus = [
      {
        systemmenu_id: 0,
        name: '根目录',
        isParent: true,
        title: '根目录',
        expand: true,
        node_type: GLBConfig.MTYPE_ROOT,
        children: []
      }
    ]
    menus[0].children = JSON.parse(JSON.stringify(await genMenu('0')))
    common.sendData(res, menus)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const genMenu = async parentId => {
  let return_list = []

  let queryStr = `SELECT
                    a.*, b.api_path,
                    b.auth_flag,
                    b.show_flag
                  FROM
                    tbl_common_systemmenu a
                  LEFT JOIN tbl_common_api b ON a.api_id = b.api_id
                  WHERE a.parent_id = ?
                  ORDER BY
                    a.systemmenu_index`
  let menus = await model.simpleSelect(queryStr, [parentId])

  for (let m of menus) {
    let sub_menus = []
    if (m.node_type === GLBConfig.MTYPE_ROOT) {
      sub_menus = await genMenu(m.systemmenu_id)
      return_list.push({
        systemmenu_id: m.systemmenu_id,
        systemmenu_name: m.systemmenu_name,
        systemmenu_icon: m.systemmenu_icon,
        node_type: m.node_type,
        name: m.systemmenu_name,
        isParent: true,
        title: m.systemmenu_name,
        expand: true,
        parent_id: m.parent_id,
        children: sub_menus
      })
    } else {
      return_list.push({
        systemmenu_id: m.systemmenu_id,
        systemmenu_name: m.systemmenu_name,
        api_id: m.api_id,
        api_path: m.api_path,
        auth_flag: m.auth_flag,
        show_flag: m.show_flag,
        node_type: m.node_type,
        name: m.systemmenu_name + '->' + m.api_function,
        title: m.systemmenu_name + '->' + m.api_function,
        isParent: false,
        parent_id: m.parent_id
      })
    }
  }
  return return_list
}

const addFolderAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)

    let folder = await tb_common_systemmenu.create({
      systemmenu_name: doc.systemmenu_name,
      systemmenu_icon: doc.systemmenu_icon,
      node_type: '00', //NODETYPEINFO
      parent_id: doc.parent_id
    })

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const modifyFolderAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let user = req.user

    let folder = await tb_common_systemmenu.findOne({
      where: {
        systemmenu_id: doc.systemmenu_id
      }
    })

    if (folder) {
      folder.systemmenu_name = doc.systemmenu_name
      folder.systemmenu_icon = doc.systemmenu_icon
      await folder.save()
    } else {
      return common.sendError(res, 'common_api_02')
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const getApiName = path => {
  if (path) {
    let patha = path.split('/')
    let func = patha[patha.length - 1].toUpperCase()
    return func
  } else {
    return ''
  }
}

const addMenuAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let user = req.user

    let afolder = await tb_common_systemmenu.findOne({
      where: {
        systemmenu_name: doc.systemmenu_name
      }
    })

    let aapi = await tb_common_api.findOne({
      where: {
        api_name: doc.systemmenu_name
      }
    })

    let tapi = await tb_common_api.findOne({
      where: {
        api_function: getApiName(doc.api_path)
      }
    })
    if (afolder || aapi || tapi) {
      return common.sendError(res, 'common_api_01')
    } else {
      let api = await tb_common_api.create({
        api_name: doc.systemmenu_name,
        api_path: doc.api_path,
        api_function: getApiName(doc.api_path),
        auth_flag: doc.auth_flag,
        show_flag: doc.show_flag
      })

      let folder = await tb_common_systemmenu.create({
        systemmenu_name: doc.systemmenu_name,
        api_id: api.api_id,
        api_function: api.api_function,
        node_type: '01', //NODETYPEINFO
        parent_id: doc.parent_id
      })
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const modifyMenuAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let user = req.user

    let menum = await tb_common_systemmenu.findOne({
      where: {
        systemmenu_id: doc.systemmenu_id
      }
    })

    if (menum) {
      let api = await tb_common_api.findOne({
        where: {
          api_id: menum.api_id
        }
      })

      if (api.api_name != doc.systemmenu_name) {
        let afolder = await tb_common_systemmenu.findOne({
          where: {
            systemmenu_name: doc.systemmenu_name
          }
        })

        let aapi = await tb_common_api.findOne({
          where: {
            api_name: doc.systemmenu_name
          }
        })
        if (afolder || aapi) {
          return common.sendError(res, 'common_api_01')
        }
      }

      if (api.api_function != getApiName(doc.api_path)) {
        let tapi = await tb_common_api.findOne({
          where: {
            api_function: getApiName(doc.api_path)
          }
        })
        if (tapi) {
          return common.sendError(res, 'common_api_01')
        }
      }

      if (api) {
        api.api_name = doc.systemmenu_name
        api.api_path = doc.api_path
        api.api_function = getApiName(doc.api_path)
        api.auth_flag = doc.auth_flag
        api.show_flag = doc.show_flag
        await api.save()
        menum.systemmenu_name = doc.systemmenu_name
        menum.api_function = api.api_function
        await menum.save()
      } else {
        return common.sendError(res, 'common_api_02')
      }
    } else {
      return common.sendError(res, 'common_api_02')
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const getApiAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let user = req.user

    let api = await tb_common_api.findOne({
      where: {
        api_id: doc.api_id
      }
    })

    common.sendData(res, api)
  } catch (error) {
    common.sendFault(res, error)
  }
}
