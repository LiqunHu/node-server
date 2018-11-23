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
[sequelize]: http://docs.sequelizejs.com/
[node-schedule]：https://github.com/node-schedule/node-schedule#readme
[joi]: https://github.com/hapijs/joi



## Installation

You should have a docker environment. Then everything will be done. :)
got docker from https://www.docker.com

## Usage

1.1st time init the project<br/>
bash init.sh<br/>
#mysql port 33306<br/>
#redis port 6379<br/>

2. When you reboot your computer. <br/>
   bash boot.sh<br/>

3. When control + c to stop the server. <br/>
   bash start.sh<br/>

#for webstorm <br/>
#please add export NODE_ENV=test to .bash_profile
#run the project with local node

---

http://localhost you will have the web home.
