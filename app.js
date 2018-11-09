const log4js = require('log4js')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const config = require('./config')

let app = express()
let cors = require('cors')
let ejs = require('ejs')

let authority = require('./util/Authority')
let AuthSRV = require('./util/AuthSRV')
let FileSRV = require('./util/FileSRV')
let routers = require('./routes')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.engine('.html', ejs.__express)
app.set('view engine', 'html')

app.use(cors())

app.use(express.static(path.join(__dirname, 'public')))
app.use('/temp', express.static(path.join(__dirname, '../public/temp')))
if (config.mongoFileFlag === false) {
  app.use('/files', express.static(path.join(__dirname, '../public/files')))
}
app.use(
  log4js.connectLogger(log4js.getLogger('http'), {
    level: 'auto',
    nolog: '\\.gif|\\.jpg$'
  })
)
app.use(
  bodyParser.json({
    limit: '50mb'
  })
)
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)
app.use(
  bodyParser.text({
    type: 'text/*'
  })
)
app.use(bodyParser.raw())
app.use(cookieParser())
app.use('/api', authority.AuthMiddleware)

//处理webpack服务请求
app.get('/__webpack_hmr', function(req, res) {
  res.send('')
})

app.get('/', (req, res) => {
  res.redirect('index.html')
})

if (config.mongoFileFlag) {
  app.get('/filesys/:filetag', FileSRV.FileResource)
}

app.post('/api/auth', AuthSRV.AuthResource)
app.post('/api/signout', AuthSRV.SignOutResource)

//common
app.use('/api/common', routers.common)

// todo
module.exports = app
