/* 用户所属组 */
const db = require('../../util/db')
const GLBConfig = require('../../util/GLBConfig')

module.exports = db.defineModel('tbl_common_user_groups', {
  user_groups_id: {
    type: db.IDNO,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: db.ID,
    allowNull: false
  },
  usergroup_id: {
    // 用户组
    type: db.IDNO,
    allowNull: false
  }
})
