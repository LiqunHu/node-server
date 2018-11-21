const _ = require('lodash')
let a = _.defaultsDeep({ a: [6, 2, 4] }, { a: [3] })
console.log(a)
