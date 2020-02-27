'use strict';

const {
  LinRouter,
  NotFound,
  disableLoading
} = require('lin-mizar');
const {
  LoginType
} = require('../../libs/enum')
const {
  User
} = require('../../models/user')
const {Auth} = require('../../middlewares/auth')
const { WXManager } = require('../../services/wx')
const { TokenValidator,NotEmptyValidator } = require('../../validators/token');


const tokenApi = new LinRouter({
  prefix: '/v1/token'
});

// book 的dao 数据库访问层实例

 tokenApi.post('/', async ctx => {
  const v = await new TokenValidator().validate(ctx)
  let token;
  switch (v.get('body.type')) {
      case LoginType.USER_EMAIL:
          token = await emailLogin(v.get('body.account'),
              v.get('body.secret'))
          break
      case LoginType.USER_MINI_PROGRAM:
          token = await WXManager.codeToToken(v.get('body.account'))
          break
      case LoginType.ADMIN_EMAIL:
          break
      default:
          throw new global.errs.ParameterException('没有相应的处理函数')
  }
  ctx.body = {
      token
  }
});

tokenApi.post('/verify',   async ctx => {
  const v =await new NotEmptyValidator().validate(ctx)
  const result = Auth.verifyToken(v.get('body.token'))
  ctx.body = {
      isValid:result
  }
});



module.exports = { tokenApi, [disableLoading]: false };
