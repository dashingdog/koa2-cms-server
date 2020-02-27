const basicAuth = require('basic-auth')
const jwt = require('jsonwebtoken')
const {security} = require('../config/secure')
const { Forbidden } = require('lin-mizar');
class Auth {
    constructor(level) {
        this.level = level || 1
        Auth.USER = 8
        Auth.ADMIN = 16
        Auth.SUPER_ADMIN = 32
    }

    get m() {
        return async (ctx, next) => {
            const userToken = basicAuth(ctx.req)
            let errMsg = 'token不合法'

            if (!userToken || !userToken.name) {
                throw new Forbidden({msg:errMsg})
            }
            try {
                var decode = jwt.verify(userToken.name, 
                    security.secretKey)
            } catch (error) {
                if (error.name == 'TokenExpiredError'){
                    errMsg = 'token已过期'
                }
                throw new Forbidden({msg:errMsg})
            }

            if(decode.scope < this.level){
                errMsg = '权限不足'
                throw new Forbidden({msg:errMsg})
            }

            // uid,scope
            ctx.auth = {
                uid:decode.uid,
                scope:decode.scope
            }

            await next()
        }
    }

    static verifyToken(token){
        try{
            jwt.verify(token, 
                security.secretKey)
            return true
        }
        catch (error){
            return false
        }

    }
}

module.exports = {
    Auth
}