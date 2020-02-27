const { InfoCrudMixin } = require('lin-mizar/lin/interface');
const { merge } = require('lodash');
const { Sequelize, Model } = require('sequelize');
const { db } = require('lin-mizar/lin/db');

class AppUser extends Model {
  toJSON(){
    let origin = {
      id: this.id,
      avatar: this.avatar,
      gender: this.gender,
      nickName: this.nickName,
      province: this.province,
      city: this.city,
      nickName: this.nickName,
      country: this.country,
      birth: this.birth,
      balance:this.balance,
      isCertification:this.isCertification,
      school:this.school,
      department:this.department,
      major:this.major,
      create_time:this.create_time
    };
    return origin;
  }
}

AppUser.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: Sequelize.STRING(64)
    },
    avatar: {
      type: Sequelize.STRING(256)
    },
    gender: {
      type: Sequelize.INTEGER
    },
    nickName: {
      type: Sequelize.STRING(32)
    },
    openid: {
      type: Sequelize.STRING(64)
    },
    session_key:{
      type: Sequelize.STRING(64)
    },
    province: {
      type: Sequelize.STRING(32)
    },
    city: {
      type: Sequelize.STRING(32)
    },
    country: {
      type: Sequelize.STRING(32)
    },
    birth: {
      type: Sequelize.STRING(32)
    },
  },
  merge(
    {
      tableName: 'user',
      modelName: 'user',
      sequelize: db
    },
    InfoCrudMixin.options
  )
);

module.exports = { AppUser };