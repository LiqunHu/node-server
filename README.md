## 主要功能插件

| Project | Description |
|---------|-------------|
| [lodash]          | 常用操作函数 |
| [express]         | web框架 |
| [ws]              | WebSocket |
| [crypto-js]       | 加解密库 |
| [log4js]          | 日志库 |
| [sequelize]       | 数据库操作ORM 组件 |
| [node-schedule]   | 定时任务组件 |
| [joi]   | 入参校验以及swagger生成 |

[lodash]: https://www.lodashjs.com
[express]: https://expressjs.com
[ws]: https://github.com/websockets/ws
[crypto-js]: https://github.com/brix/crypto-js
[log4js]: https://log4js-node.github.io/log4js-node/index.html
[sequelize]: http://docs.sequelizejs.com
[node-schedule]: https://github.com/node-schedule/node-schedule#readme
[joi]: https://github.com/hapijs/joi



## 安装说明
系统最好有docker环境,脚本将直接初始化以来数据库以及三方程序

You should have a docker environment. Then everything will be done. :)
got docker from https://www.docker.com

## 使用

1.首次运营项目<br/>
bash init.sh<br/>
#mysql port 33306<br/>
#redis port 6379<br/>
项目将自动构建以及启动，会自动拉起mysql mongodb redis等相关应用

2. 当重启docker或机器时. <br/>
   bash boot.sh<br/>
   将自动拉起应用所需要的以来应用<br/>

