const util = require('util')
const axios = require('axios')
// const { security, wx } = require('../config/secure')
const { config } = require('lin-mizar/lin/config');
const { Auth } = require('../middlewares/auth')
const { UserDao } = require('../dao/user');
const jwt = require('jsonwebtoken')
const { AuthFailed,Failed } = require('lin-mizar');
const stringRandom = require('string-random')
const crypto = require('crypto');
const Xml2js = require('xml2js');
// book 的dao 数据库访问层实例
const userDto = new UserDao();
class WXManager {
    static async codeToToken(code) {
        const url = util.format(config.getItem('wx.loginUrl'),
            config.getItem('wx.appId'),
            config.getItem('wx.appSecret') ,
            code)

        const result = await axios.get(url)
        if (result.status !== 200) {
            throw new AuthFailed({ msg: 'openid获取失败' })
        }
        const errcode = result.data.errcode
        const errmsg = result.data.errmsg
        if (errcode) {
            throw new AuthFailed({
                errorCode: errcode,
                msg: 'openid获取失败:' + errmsg
            })
        }
        let user = await userDto.getUserByOpenid(result.data.openid, result.data.session_key)
        if (!user) {
            user = await userDto.registerByOpenid(result.data.openid, result.data.session_key)
        }
        return generateToken(user.id, Auth.USER)
    }

    static async unifiedorder(out_trade_no,openid, total_fee) {
        // 先将需要发送的参数创建好,然后根据参数名ASCII码从小到大排序（字典序）
        let order = {
            appid: config.getItem('wx.appId'),
            body: "一乎小程序-发布任务支付赏金",
            mch_id:config.getItem('wx.merchantId'),
            //    生成随机字符串，长度32位以内,我们使用stringRandom库生成16位随机数
            nonce_str: stringRandom(16),
            notify_url: config.getItem('siteDomain')+'/v1/task/pay/result',
            openid,
            out_trade_no:out_trade_no,
            spbill_create_ip: config.getItem('spbill_create_ip'),
            total_fee,
            trade_type: "JSAPI",
        }
        //    将参数对象转为key=value模式的字符串,用&分隔
        let stringA = obj2String(order)
        //    将生成的字符串末尾拼接上API密钥（key设置路径：微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置）
        let stringSignTemp = stringA + `&key=${config.getItem('wx.merchantKey')}`
        //    通过HMAC-SHA256或者MD5生成sign签名，这里我们使用md5，然后将签名加入参数对象内
        let md5 = crypto.createHash('md5')
        md5.update(stringSignTemp);
        order.sign = md5.digest('hex').toUpperCase()
        //    将参数对象专为xml格式
        const builder = new Xml2js .Builder();
        const xml = builder.buildObject(order);
        //    发送请求
        const result = await axios.post("https://api.mch.weixin.qq.com/pay/unifiedorder",xml)
        const parser = new Xml2js.Parser();
        const xmlObj =await parser.parseStringPromise(result.data)
        if(xmlObj.xml.return_code[0]==='FAIL'){
            throw new Failed({
                msg:`支付失败,${xmlObj.xml.return_msg[0]}`,
            })
        }
        if(xmlObj.xml.result_code&&xmlObj.xml.result_code[0]==='SUCCESS'){
            let payData= {
                appId:xmlObj.xml.appid[0],
                nonceStr:xmlObj.xml.nonce_str[0],
                package:`prepay_id=${xmlObj.xml.prepay_id[0]}`,
                signType:"MD5",
                timeStamp:new Date().getTime().toString(),
                key:config.getItem('wx.merchantKey')
            }
            const StringPay = obj2String(payData)
            let payMd5 = crypto.createHash('md5')
            payMd5.update(StringPay);
            let paySign= payMd5.digest('hex').toUpperCase();
            payData.paySign = paySign;
            delete payData.key;
            return payData
        }else{
            throw new Failed({
                msg:`支付失败,${xmlObj.xml.err_code[0]}:${xmlObj.xml.err_code_des[0]}`,
            })
        }
        
    }

}

const obj2String = function(obj){
    let stringA = '';
    const keyArr = Object.keys(obj)
    keyArr.forEach((key,index)=>{
        stringA+=`${key}=${obj[key]}`
        if(index!=keyArr.length-1){
            stringA+='&'
        }
    })
    return stringA
}

const generateToken = function (uid, scope) {
    const secretKey = config.getItem('security.secretKey')
    const expiresIn = config.getItem('security.expiresIn')
    const token = jwt.sign({
        uid,
        scope
    }, secretKey, {
        expiresIn
    })
    return token
}
module.exports = {
    WXManager
}