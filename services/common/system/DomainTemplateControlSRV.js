const fs = require('fs')
const common = require('../../../util/CommonUtil')
const GLBConfig = require('../../../util/GLBConfig')
const logger = require('../../../util/Logger').createLogger('GroupControlSRV')
const model = require('../../../model')

// tables
const tb_common_systemmenu = model.common_systemmenu
const tb_common_domaintemplate = model.common_domaintemplate
const tb_common_templatemenu = model.common_templatemenu

exports.DomainTemplateControlResource = (req, res) => {
  let method = common.reqTrans(req, __filename)
  if (method === 'init') {
    initAct(req, res)
  } else if (method === 'searchTemplate') {
    searchTemplateAct(req, res)
  } else if (method === 'addTemplate') {
    addTemplateAct(req, res)
  } else if (method === 'deleteTemplate') {
    deleteTemplateAct(req, res)
  } else if (method === 'searchTemplateMenu') {
    searchTemplateMenuAct(req, res)
  } else if (method === 'addFolder') {
    addFolderAct(req, res)
  } else if (method === 'modifyFolder') {
    modifyFolderAct(req, res)
  } else if (method === 'deleteSelect') {
    deleteSelectAct(req, res)
  } else if (method === 'addMenus') {
    addMenusAct(req, res)
  } else if (method === 'changeOrder') {
    changeOrderAct(req, res)
  } else {
    common.sendError(res, 'common_01')
  }
}

const initAct = async (req, res) => {
  try {
    let user = req.user,
      returnData = {
        tfInfo: GLBConfig.TFINFO
      }
    returnData.sysmenus = [
      {
        systemmenu_id: 0,
        name: '根目录',
        isParent: true,
        node_type: GLBConfig.MTYPE_ROOT,
        children: []
      }
    ]
    returnData.sysmenus[0].children = JSON.parse(JSON.stringify(await genMenu('0')))

    common.sendData(res, returnData)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const genMenu = async parentId => {
  let return_list = []
  let menus = await tb_common_systemmenu.findAll({
    where: {
      parent_id: parentId
    },
    order: [['created_at', 'DESC']]
  })
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
        parent_id: m.parent_id,
        children: sub_menus
      })
    } else {
      return_list.push({
        systemmenu_id: m.systemmenu_id,
        systemmenu_name: m.systemmenu_name,
        api_id: m.api_id,
        api_function: m.api_function,
        node_type: m.node_type,
        name: m.systemmenu_name + '->' + m.api_function,
        isParent: false,
        parent_id: m.parent_id
      })
    }
  }
  return return_list
}

const searchTemplateAct = async (req, res) => {
  try {
    let doc = common.docValidate(req),
      user = req.user

    let templates = await tb_common_domaintemplate.findAll()

    common.sendData(res, templates)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const addTemplateAct = async (req, res) => {
  try {
    let doc = common.docValidate(req),
      user = req.user

    let templates = await tb_common_domaintemplate.create({
      domaintemplate_name: doc.domaintemplate_name
    })

    common.sendData(res, templates)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const deleteTemplateAct = async (req, res) => {
  try {
    let doc = common.docValidate(req),
      user = req.user

    let templates = await tb_common_domaintemplate.findOne({
      where: {
        domaintemplate_id: doc.domaintemplate_id
      }
    })

    if (templates) {
      tb_common_templatemenu.destroy({
        where: {
          domaintemplate_id: templates.domaintemplate_id
        }
      })
      templates.destroy()
    } else {
      return common.sendError(res, 'api_template_01')
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const searchTemplateMenuAct = async (req, res) => {
  try {
    let doc = common.docValidate(req),
      user = req.user

    let menus = [
      {
        templatemenu_id: 0,
        name: '根目录',
        isParent: true,
        node_type: GLBConfig.MTYPE_ROOT,
        children: []
      }
    ]
    menus[0].children = JSON.parse(
      JSON.stringify(await genTemplateMenu(doc.domaintemplate_id, '0'))
    )

    common.sendData(res, menus)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const genTemplateMenu = async (domaintemplate_id, parentId) => {
  let return_list = []
  let menus = await tb_common_templatemenu.findAll({
    where: {
      domaintemplate_id: domaintemplate_id,
      parent_id: parentId
    },
    order: [['templatemenu_index'], ['created_at', 'DESC']]
  })
  for (let m of menus) {
    let sub_menus = []
    if (m.node_type === GLBConfig.MTYPE_ROOT) {
      sub_menus = await genTemplateMenu(domaintemplate_id, m.templatemenu_id)
      return_list.push({
        templatemenu_id: m.templatemenu_id,
        templatemenu_name: m.templatemenu_name,
        templatemenu_icon: m.templatemenu_icon,
        node_type: m.node_type,
        name: m.templatemenu_name,
        isParent: true,
        parent_id: m.parent_id,
        root_show_flag: m.root_show_flag,
        children: sub_menus
      })
    } else {
      return_list.push({
        templatemenu_id: m.templatemenu_id,
        templatemenu_name: m.templatemenu_name,
        api_id: m.api_id,
        api_function: m.api_function,
        node_type: m.node_type,
        name: m.templatemenu_name,
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
    let user = req.user

    let nextIndex = await tb_common_templatemenu.max('templatemenu_index', {
      where: {
        parent_id: doc.parent_id
      }
    })
    if (!nextIndex) {
      nextIndex = 0
    } else {
      nextIndex += 1
    }

    let folder = await tb_common_templatemenu.create({
      domaintemplate_id: doc.domaintemplate_id,
      templatemenu_name: doc.templatemenu_name,
      templatemenu_icon: doc.templatemenu_icon,
      node_type: '00', //NODETYPEINFO
      parent_id: doc.parent_id,
      root_show_flag: doc.root_show_flag,
      templatemenu_index: nextIndex
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

    let folder = await tb_common_templatemenu.findOne({
      where: {
        templatemenu_id: doc.templatemenu_id
      }
    })

    if (folder) {
      folder.templatemenu_name = doc.templatemenu_name
      folder.templatemenu_icon = doc.templatemenu_icon
      folder.root_show_flag = doc.root_show_flag
      await folder.save()
    } else {
      return common.sendError(res, 'common_api_02')
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const deleteSelectAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let user = req.user

    let tm = await tb_common_templatemenu.findOne({
      where: {
        templatemenu_id: doc.templatemenu_id
      }
    })
    if (tm) {
      if (doc.node_type === '00') {
        await folderDelete(tm.templatemenu_id)
      }
      await tm.destroy()
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const folderDelete = async templatemenu_id => {
  let subM = await tb_common_templatemenu.findAll({
    where: {
      parent_id: templatemenu_id
    },
    order: [['node_type']]
  })

  for (let sm of subM) {
    if ((sm.node_type = '00')) {
      await folderDelete(sm.templatemenu_id)
    }
    await sm.destroy()
  }
}

const addMenusAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let user = req.user

    let existM = await tb_common_templatemenu.findAll({
      where: {
        domaintemplate_id: doc.domaintemplate_id,
        parent_id: doc.parent_id
      }
    })

    let addMenus = []
    for (let m of doc.menus) {
      let addFlag = true
      for (let em of existM) {
        if (m.api_id === em.api_id) {
          addFlag = false
          break
        }
      }
      if (addFlag) {
        addMenus.push(m)
      }
    }

    let nextIndex = await tb_common_templatemenu.max('templatemenu_index', {
      where: {
        parent_id: doc.parent_id
      }
    })

    if (!nextIndex) {
      nextIndex = 0
    }

    for (let am of addMenus) {
      await tb_common_templatemenu.create({
        domaintemplate_id: doc.domaintemplate_id,
        templatemenu_name: am.systemmenu_name,
        api_id: am.api_id,
        api_function: am.api_function,
        node_type: '01', //NODETYPEINFO
        parent_id: doc.parent_id,
        templatemenu_index: nextIndex
      })
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}

const changeOrderAct = async (req, res) => {
  try {
    let doc = common.docValidate(req)
    let user = req.user

    for (let i = 0; i < doc.menus.length; i++) {
      let tmenu = await tb_common_templatemenu.findOne({
        where: {
          templatemenu_id: doc.menus[i].templatemenu_id
        }
      })
      tmenu.templatemenu_index = i
      await tmenu.save()
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error)
  }
}
