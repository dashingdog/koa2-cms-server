const {
    LoginType,
} = require('../libs/enum')
const { LinValidator, Rule } = require('lin-mizar');
class NotEmptyValidator extends LinValidator {
    constructor() {
        super()
        this.token = [
            new Rule('isLength', '不允许为空', {
                min: 1
            })
        ]
    }
}

class TokenValidator extends LinValidator {
    constructor() {
        super()
        this.account =new Rule('isLength', '不符合账号规则', {
                min: 4,
                max: 32
            })
        this.secret = [
            //    validator.js
            new Rule('isOptional'),
            new Rule('isLength', '至少6个字符', {
                min: 6,
                max: 128
            })
        ]

    }

    validateLoginType(vals) {
        if (!vals.body.type) {
            return [false, "type是必须参数"];
        }
        if (!LoginType.isThisType(vals.body.type)) {
            return [false, "type参数不合法"];
        }
        return true
    }
}


module.exports = {
    TokenValidator,
    NotEmptyValidator,
}