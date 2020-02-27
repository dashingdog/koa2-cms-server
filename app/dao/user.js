/* eslint-disable new-cap */
'use strict';

const { RepeatException, ParametersException } = require('lin-mizar');
const { set, has } = require('lodash');
const { AppUser, Member } = require('../models/appuser')
const { Failed } = require('lin-mizar');
const { db } = require('lin-mizar/lin/db');
const { config } = require("lin-mizar/lin/config");
const WXBizDataCrypt = require('../libs/WXBizDataCrypt')
class UserDao {
  async createUser(ctx, v) {
    let user = await ctx.manager.userModel.findOne({
      where: {
        username: v.get('body.username')
      }
    });
    if (user) {
      throw new RepeatException({
        msg: '用户名重复，请重新输入'
      });
    }
    if (v.get('body.email') && v.get('body.email').trim() !== '') {
      user = await ctx.manager.userModel.findOne({
        where: {
          email: v.get('body.email')
        }
      });
      if (user) {
        throw new RepeatException({
          msg: '注册邮箱重复，请重新输入'
        });
      }
    }
    this.registerUser(ctx, v);
  }

  async updateUser(ctx, v) {
    let user = ctx.currentUser;
    if (v.get('body.email') && user.email !== v.get('body.email')) {
      const exit = await ctx.manager.userModel.findOne({
        where: {
          email: v.get('body.email')
        }
      });
      if (exit) {
        throw new ParametersException({
          msg: '邮箱已被注册，请重新输入邮箱'
        });
      }
      user.email = v.get('body.email');
    }
    if (v.get('body.nickname')) {
      user.nickname = v.get('body.nickname')
    }
    user.save();
  }

  async getAuths(ctx) {
    let user = ctx.currentUser;
    let auths = await ctx.manager.authModel.findAll({
      where: {
        group_id: user.group_id
      }
    });
    let group = await ctx.manager.groupModel.findOne({
      where: {
        id: user.group_id
      }
    })
    const aus = this.splitAuths(auths);
    set(user, 'auths', aus);
    if (group) {
      set(user, 'groupName', group.name);
    }
    return user;
  }

  splitAuths(auths) {
    let tmp = {};
    auths.forEach(au => {
      if (!has(tmp, au['module'])) {
        tmp[au['module']] = [
          {
            module: au['module'],
            auth: au['auth']
          }
        ];
      } else {
        tmp[au['module']].push({
          module: au['module'],
          auth: au['auth']
        });
      }
    });
    const aus = Object.keys(tmp).map(key => {
      let tm1 = Object.create(null);
      set(tm1, key, tmp[key]);
      return tm1;
    });
    return aus;
  }

  registerUser(ctx, v) {
    const user = new ctx.manager.userModel();
    user.username = v.get('body.username');
    user.password = v.get('body.password');
    user.group_id = v.get('body.group_id');
    if (v.get('body.email') && v.get('body.email').trim() !== '') {
      user.email = v.get('body.email');
    }
    user.save();
  }

  async getUserByOpenid(openid, session_key) {
    const user = await AppUser.findOne({
      where: {
        openid
      }
    });
    if (user&&(user.session_key != session_key)) {
      user.session_key = session_key;
      await user.save()
    }
    return user
  }

  async registerByOpenid(openid, session_key) {
    // user.openid = openId;
    // user.username='未名';
    // await user.save();
    // return user;
    return await AppUser.create({
      openid,
      session_key
    })
  }

  async certificationApply(v, uid) {
    let user = await AppUser.findOne({
      where: {
        id: uid
      }
    })
    if (user.isCertification == 1) {
      throw new Failed({
        msg: "该用户已认证一乎，请勿重复提交"
      });
    }
    if (user.isCertification == 2) {
      throw new Failed({
        msg: "认证正在审核中，请勿重复提交"
      });
    }
    try {
      let transaction = await db.transaction()
      let member = await Member.create({
        userId: uid,
        realName: v.get('body.realName'),
        idCardNumber: v.get('body.idCardNumber'),
        idCardImage: v.get('body.idCardImage'),
        communityId: v.get('body.communityId'),
        phone: v.get('body.phone')
      }, { transaction });
      user.isCertification = 2;
      await user.save({
        transaction
      })
      await transaction.commit();
    } catch (err) {
      if (transaction) await transaction.rollback();
    }
    return true;

  }
  async getUserInfo(uid) {
    return await AppUser.findOne({
      where: {
        id: uid
      }
    })
  }
  async EditUserInfo(v,uid){
    let user  = await this.getUserInfo(uid)
    user.avatar = v.get('body.avatar')
    user.nickName = v.get('body.nickName')
    user.birth = v.get('body.birth')
    user.school = v.get('body.school')
    user.department = v.get('body.department')
    user.major = v.get('body.major')
    return await user.save()
  }

  async WxUpdateUserInfo(uid, encryptedData, iv) {
    const user = await this.getUserInfo(uid);
    let pc = new WXBizDataCrypt( config.getItem("wx.appId"), user.session_key );
    let data = pc.decryptData(encryptedData, iv)
    console.log(data);
    user.nickName = data.nickName;
    user.gender = data.gender;
    user.city = data.city;
    user.province = data.province;
    user.country = data.country;
    user.avatar = data.avatarUrl;
    await user.save();
    return true
  }
}

module.exports = { UserDao };
