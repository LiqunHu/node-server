const config = {
  mysql: {
    normal: {
      database: 'mvnndata',
      username: 'root',
      password: '123456',
      host: 'localhost',
      port: 33306
    },
    readonly: {
      database: 'mvnndata',
      username: 'root',
      password: '123456',
      host: 'localhost',
      port: 33306
    }
  },
  redis: {
    host: 'localhost',
    port: 16379,
    opts: {}
  },
  // for mongo
  mongoFileFlag: true,
  mongoSyncFlag: false,
  mongo: {
    url: 'mongodb://127.0.0.1:27017',
    options: {},
    dbName: 'mvnndata',
    bucketName: 'gridfsmvnn'
  },
  // for elasticsearch
  elasticsearch: {
    index: 'mvnn',
    host: '127.0.0.1:9200',
    log: {
      type: 'file',
      level: 'error',
      path: '../log/elasticsearch.log'
    }
  },
  // for rabbitmqClinet
  rabbitmq: {
    connectOptions: {
      protocol: 'amqp',
      hostname: 'localhost',
      port: 5672,
      username: 'mvnnrabbit',
      password: '123456'
    },
    publisherQueue: {
      config: {
        max: 2, // maximum size of the pool
        min: 1 // minimum size of the pool
      },
      queues: ['test']
    },
    consumerQueue: ['test']
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
        },
        logstash: {
          category: 'mvnn',
          type: 'log4js-logstash-tcp',
          host: '127.0.0.1',
          port: 5050,
          fields: {
            instance: 'imccAuth',
            source: 'imccAuth',
            environment: 'development'
          }
        }
      },
      categories: {
        default: {
          appenders: ['out', 'everything', 'logstash'],
          level: 'debug'
        }
      }
    }
  },
  wsservers: {
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
  // schedule job
  scheduleJobs: [],
  sms: {
    appid: '26763',
    appkey: '0d7e27433af7744451809fb2136ae834',
    signtype: 'normal' /*可选参数normal,md5,sha1*/
  },
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
  SECRET_KEY: 'zc7#_66#g%u2n$j_)j$-r(swt74d(2l%wc2y=wqt_m8kpy%04*',
  TOKEN_AGE: 43200000, // 12 * 60 * 60 * 10000
  MOBILE_TOKEN_AGE: 31536000000 // 365 * 24 * 60 * 60 * 1000
}

module.exports = config
