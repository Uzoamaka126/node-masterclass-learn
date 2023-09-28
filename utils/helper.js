/* 
* helper functions 
*/
const crypto = require('crypto');
const config = require('../lib/config');
const queryString = require('querystring');
const https = require("https")

function sendTwilioSms(phone, msg, callback) {
    // validate phone and messge
    phone = helpers.isTypeOfValid(phone, "string") && helpers.isStringValid(phone, 10) ? phone.trim() : false;
    msg = helpers.isTypeOfValid(msg, "string") && helpers.isStringValid(msg, 0, 1600) ? msg.trim() : false;

   if (phone && msg) {
    // configure the request payload being sent to Twilio
        const payload = {
            "From": config.twilio.fromPhone, // sender phone
            "To": `+1${phone}`,
            "Body": msg
        }
        // stringfy the payload 
        const stringfiedPayload = queryString(payload);

        // configure the https request details
        const reqDetails = {
            'protocol': 'https',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': `/2023-09-23/${config.twilio.accountSid}/Messages.json`,
            'auth': `${config.twilio.accountSid}:${config.twilio.authToken}`,
            'headers': {
                'Content-Type': 'application/x-www-form-url-encoded', // standard form being posted
                'Content-Length': Buffer.byteLength(stringfiedPayload) // get the byte length of the stringified payload
            }
        };

        // instantiate the request object
        const req = https.request(reqDetails, function(resObj) {
            // grab the status of the sent request
            const status = res.statusCode;
            // use callback if the request successfully went through
            if (status === 200 || status === 201) {
                callback(false)
            } else {
                callback(`Status code returned was ${status}`)
            }
        }); // send off the details

        // bind to an error event so it doesn't get thrown
        req.on('error', function(err) {
            callback(err)
        })
        // add the string payload
        req.write(stringfiedPayload);

        // send off/end the request
        req.end()

   } else {
    callback("Required fields missing or invalid")
   }
}

function isStringValid(value, minNum = 0, maxNum) {
    if (!value || (typeof(value) !== 'string')) {
        return false
    }

    if (value?.trim().length < minNum) {
        return false
    }

    if (value?.trim().length > maxNum) {
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
    isInstanceOfArray,
    sendTwilioSms
}