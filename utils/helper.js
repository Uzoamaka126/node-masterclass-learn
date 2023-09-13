/* 
* helper functions 
*/
const crypto = require('crypto');
const config = require('../config');

function isStringValid(obj, key, num = 0) {
    if (!obj[key] || (typeof(obj[key]) !== 'string')) {
        return false
    }

    if (obj[key]?.trim().length <= num) {
        return false
    }

    return true
}

function hash(value) {
    if (typeof val === 'string' && value.length > 0) {
        // hash with sha-256
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(value).digest('hex');
        return hash;
    } else {
        return false
    }
}

module.exports = {
    isStringValid,
    hash
}