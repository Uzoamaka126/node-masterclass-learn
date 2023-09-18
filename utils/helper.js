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

function generateRandomString(num = 20) {
    if (num > 0) {
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890';
        let str = '';

        for (var i = 0; i < num; i++) {
            // get a random character from the possible characters
            const randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // append the character to the final string
            str += randomChar
        }
        return str;
    } else {
        return false
    }
}

function isTypeOfValid(value, type) {
    if (typeof (value) === type) {
        return true
    } else {
        return false
    }
}

function isInstanceOfArray(item) {
    return item instanceof Array
}

module.exports = {
    isStringValid,
    hash,
    parseJSONToObject,
    isBoolValid,
    generateRandomString,
    isTypeOfValid,
    isInstanceOfArray
}