const rp = require('request-promise');

const common = require('../../util/CommonUtil');
const GLBConfig = require('../../util/GLBConfig');
const Sequence = require('../../util/Sequence');
const logger = require('../../util/Logger').createLogger('FarmerbuyMPSRV');
const config = require('../../config');
const model = require('../../model');
const Security = require('../../util/Security');
const AuthSRV = require('../../util/AuthSRV');

const tb_common_user = model.common_user;
const tb_common_domain = model.common_domain;
const tb_common_usergroup = model.common_usergroup;

exports.FarmerbuyMPResource = (req, res) => {
  let method = req.query.method
  if (method === 'getSwiper') {
    getSwiperAct(req, res)
  } else if (method === 'getGoodsList') {
    getGoodsListAct(req, res)
  } else if (method === 'wxReg') {
    wxRegAct(req, res)
  } else {
    common.sendError(res, 'common_01');
  }
}

async function getSwiperAct(req, res) {
  try {
    let returnData = {
      data: [{
          url: 'tfs/TB1.Zy6OFXXXXbhXpXXXXXXXXXX-1280-520.jpg'
        },
        {
          url: 'tps/TB1YTkBOpXXXXbLaXXXXXXXXXXX-1280-520.jpg'
        },
        {
          url: 'tps/TB1TikAOpXXXXaWXFXXXXXXXXXX-1280-520.jpg'
        },
        {
          url: 'tps/TB1pre1OFXXXXaGXXXXXXXXXXXX-1280-520.jpg'
        },
      ]
    }
    common.sendData(res, returnData);
  } catch (error) {
    common.sendFault(res, error);
  }
}

async function getGoodsListAct(req, res) {
  try {
    let returnData = {
      data: [{
          url: 'i4/TB1onyyOXXXXXcrapXXXXXXXXXX_.jpg',
          showName: '苹果',
          desc: 'aaaaa',
          price: '14.00',
          sales: '0'
        },
        {
          url: 'i4/TB18r0eOpXXXXa9apXXXXXXXXXX_.jpg',
          showName: '地瓜',
          desc: 'bbbbb',
          price: '19.00',
          sales: '2'
        },
        {
          url: 'i4/TB1FCxZOXXXXXXcaXXXXXXXXXXX_.jpg',
          showName: '土豆',
          desc: 'ccccccc',
          price: '27.00',
          sales: '4'
        },
        {
          url: 'i3/TB1wwcCOpXXXXaCXXXXXXXXXXXX_.jpg',
          showName: '茄子',
          desc: 'ddddddddddddd',
          price: '32.00',
          sales: '100'
        },
      ]
    }
    common.sendData(res, returnData);
  } catch (error) {
    common.sendFault(res, error);
  }
}

async function wxRegAct(req, res) {
  try {
    let doc = common.docTrim(req.body),
      returnData = {};

    if (!('wxCode' in doc)) {
      return common.sendError(res, 'farmerbuywx_01');
    }
    if (!('phone' in doc)) {
      return common.sendError(res, 'farmerbuywx_02');
    }
    if (!('captcha' in doc)) {
      return common.sendError(res, 'farmerbuywx_03');
    }
    if (!('info' in doc)) {
      return common.sendError(res, 'farmerbuywx_04');
    }
    let url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + config.weixin.appid + '&secret=' + config.weixin.app_secret + '&js_code=' + doc.wxCode + '&grant_type=authorization_code'
    let wxAuth = await rp(url)
    logger.info(wxAuth)
    let wxAuthjs = JSON.parse(wxAuth)
    if (wxAuthjs.openid) {
      let user = await tb_common_user.findOne({
        where: {
          user_username: doc.phone,
          state: GLBConfig.ENABLE
        }
      });
      if (!user) {
        user = await tb_common_user.findOne({
          where: {
            user_phone: doc.phone,
            state: GLBConfig.ENABLE
          }
        });
      }
      if (user) {
        user.user_wx_openid = wxAuthjs.openid
        await user.save()
      } else {
        let domain = await tb_common_domain.findOne({
          where: {
            domain_type: GLBConfig.DOMAIN_ADMINISTRATOR
          }
        })

        let group = await tb_common_usergroup.findOne({
          where: {
            usergroup_type: GLBConfig.TYPE_DEFAULT
          }
        })

        await tb_common_user.create({
          user_id: await Sequence.genUserID(),
          domain_id: domain.domain_id,
          usergroup_id: group.usergroup_id,
          user_username: doc.phone,
          user_wx_openid: wxAuthjs.openid,
          user_email: doc.user_email,
          user_phone: doc.phone,
          user_password: common.generateRandomAlphaNum(6),
          user_name: doc.info.nickName,
          user_gender: doc.info.gender,
          user_type: group.usergroup_type,
          user_avatar: doc.info.avatarUrl
        });
      }
      req.body.loginType = 'WEIXIN'
      req.body.wxAuthjs = wxAuthjs 
      return await AuthSRV.AuthResource(req, res)
    } else {
      return common.sendError(res, 'farmerbuywx_02')
    }
  } catch (error) {
    common.sendFault(res, error);
  }
}
