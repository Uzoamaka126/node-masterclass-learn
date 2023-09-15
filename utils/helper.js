/* 
* helper functions 
*/
const crypto = require('crypto');
const config = require('../lib/config');

function isStringValid(value, num = 0) {
    if (!value || (typeof(value) !== 'string')) {
        return false
    }

    if (value?.trim().length <= num) {
        return false
    }

    return true
}

function isBoolValid(val) {
    if (typeof val !== 'boolean') {
        return false
    }
    return true
}

function hash(value) {
    console.log({ value });
    if (typeof value === 'string' && value.length > 0) {
        // hash with sha-256
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(value).digest('hex');
        return hash;
    } else {
        return false
    }
}

function parseJSONToObject(str) {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (err) {
        return {}
    }
}

module.exports = {
    isStringValid,
    hash,
    parseJSONToObject,
    isBoolValid
}