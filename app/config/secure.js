'use strict';


let db= {
  database: 'test',
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  username: 'root',
  password: 'xxxx',
  timezone: '+08:00'
}
if(process.env.NODE_ENV=="development"){
    db.logging=true
}
if(process.env.NODE_ENV=="production"){
  db.logging=false
}
module.exports = {
  db,
  security:{
    secretKey:"abcdefg",
    expiresIn:60*60*24*30
  },
  wx:{
    appId:'appid',
    appSecret:'appsecret',
    loginUrl:'https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code',
    merchantId:'yourMerchantId',
    merchantKey:"yourMerchantKey"
  },
  secret:
    '\x88W\xf09\x91\x07\x98\x89\x87\x96\xa0A\xc68\xf9\xecJJU\x17\xc5V\xbe\x8b\xef\xd7\xd8\xd3\xe6\x95*4'
};
