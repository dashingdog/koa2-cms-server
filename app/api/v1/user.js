'use strict';

const {
  LinRouter,
  NotFound,
  disableLoading
} = require('lin-mizar');

const {CertificationValidator,AuthorizationValidator,EditUserInfoValidator}  = require('../../validators/user')

const {
  User,
  Member
} = require('../../models/user')
const {Auth} = require('../../middlewares/auth')
const {UserDao} = require('../../dao/user')
const userDto = new UserDao()

const userApi = new LinRouter({
  prefix: '/v1/user'
});

userApi.get('/info',new Auth().m, async ctx => {
  const info = await userDto.getUserInfo(ctx.auth.uid);
  ctx.json(info)
});

userApi.put('/info',new Auth().m, async ctx => {
  const v = await new EditUserInfoValidator().validate(ctx)
  const result = await userDto.EditUserInfo(v,ctx.auth.uid);
  if(result){
    ctx.success({
      'msg':"修改成功"
    })
  }
});


userApi.post('/certification',new Auth().m, async ctx => {
  const v = await new CertificationValidator().validate(ctx)
  const result = await userDto.certificationApply(v,ctx.auth.uid)
  if(result){
    ctx.success({
      'msg':"申请成功，请等待审核"
    })
  }
});

userApi.post('/authorization',new Auth().m, async ctx => {
  const v = await new AuthorizationValidator().validate(ctx)
  const result = userDto.WxUpdateUserInfo(ctx.auth.uid,v.get('body.encryptedData'),v.get('body.iv'))
  if(result){
    ctx.success({
      'msg':"更新用户数据成功"
    })
  }
});



module.exports = { userApi, [disableLoading]: false };
