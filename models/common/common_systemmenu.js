const db = require('../../util/db')

module.exports = db.defineModel('tbl_common_systemmenu', {
  systemmenu_id: {
    type: db.IDNO,
    autoIncrement: true,
    primaryKey: true
  },
  systemmenu_name: {
    type: db.STRING(300),
    allowNull: false
  },
  systemmenu_icon: {
    type: db.STRING(100),
    defaultValue: '',
    allowNull: false
  },
  systemmenu_index: {
    type: db.INTEGER,
    defaultValue: '0',
    allowNull: false
  },
  api_id: {
    type: db.IDNO,
    allowNull: true
  },
  api_function: {
    type: db.STRING(100),
    defaultValue: '',
    allowNull: false
  },
  node_type: {
    // NODETYPEINFO
    type: db.STRING(2),
    allowNull: true
  },
  parent_id: {
    type: db.ID,
    allowNull: true
  }
})
