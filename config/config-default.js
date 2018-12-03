const config = {
  // for sequelize Write`
  sequelize: {
    dialect: 'mysql',
    database: 'mvnndata',
    username: 'root',
    password: '123456',
    host: 'localhost',
    port: 33306
  },
  RWSeperateFlag: false, // 读写分离标识
  // for sequelize Query`
  sequelizeQuery: {
    dialect: 'mysql',
    database: 'mvnndata',
    username: 'root',
    password: '123456',
    host: 'localhost',
    port: 33306
  },
  // for redis
  redisCache: true,
  redis: {
    host: 'localhost',
    port: 16379,
    opts: {}
  },
  // for mongo
  mongoFileFlag: true,
  mongoSyncFlag: false,
  mongo: {
    connect: 'mongodb://127.0.0.1:27017',
    dbName: 'mvnndata',
    bucketName: 'gridfsmvnn'
  },
  // for elasticsearch
  elasticsearchFlag: false,
  elasticsearch: {
    index: 'mvnn',
    host: 'localhost:9200',
    log: {
      type: 'file',
      level: 'error',
      path: '../log/elasticsearch.log'
    }
  },
  // for logger
  loggerConfig: {
    level: 'DEBUG',
    config: {
      appenders: {
        out: {
          type: 'stdout'
        },
        everything: {
          type: 'dateFile',
          filename: '../log/app.log',
          pattern: '-yyyy-MM-dd',
          compress: true
        }
      },
      categories: {
        default: {
          appenders: ['out', 'everything'],
          level: 'debug'
        }
      }
    }
  },
  // schedule Flag
  scheduleFlag: false,
  rpcservers: {
    pooltest: {
      host: '127.0.0.1',
      port: 9090,
      config: {
        max: 10, // maximum size of the pool
        min: 3 // minimum size of the pool
      },
      desc: '内部连接池测试'
    }
  },
  weixin: {
    appid: 'wx1bf0976923162a6b',
    app_secret: 'f03e63ca1aca1c007b5915b54b6ec8c7'
  },
  syslogFlag: true,
  uploadOptions: {
    autoFields: true,
    autoFiles: true,
    uploadDir: '../public/temp',
    maxFileSize: 2 * 1024 * 1024
  },
  tempDir: '../public/temp',
  filesDir: '../public/files',
  tmpUrlBase: '/temp/',
  fileUrlBase: '/files/',
  fsUrlBase: '/filesys/',
  // SECRET_KEY
  SECRET_KEY: 'zc7#_66#g%u2n$j_)j$-r(swt63d(2l%wc2y=wqt_m8kpy%04*',
  TOKEN_AGE: 43200000, // 12 * 60 * 60 * 10000
  MOBILE_TOKEN_AGE: 31536000000 // 365 * 24 * 60 * 60 * 1000
}

module.exports = config
