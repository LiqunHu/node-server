const db = require('../../util/db')

module.exports = db.defineModel('tbl_common_usergroupmenu', {
  usergroup_id: {
    type: db.IDNO,
    allowNull: false
  },
  systemmenu_id: {
    type: db.IDNO,
    allowNull: true
  }
})
