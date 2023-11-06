/* 
* helper functions 
*/
const crypto = require('crypto');
const config = require('../lib/config');
const queryString = require('querystring');
const https = require("https");
const path = require('path');
const fs = require('fs');

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

function sendTwilioSms(phone, msg, callback) {
    // validate phone and messge
    phone = isTypeOfValid(phone, "string") && isStringValid(phone, 10) ? phone.trim() : false;
    msg = isTypeOfValid(msg, "string") && isStringValid(msg, 0, 1600) ? msg.trim() : false;

   if (phone && msg) {
    // configure the request payload being sent to Twilio
        const payload = {
            "From": config.twilio.fromPhone, // sender phone
            "To": `+1${phone}`,
            "Body": msg
        }
        // stringfy the payload 
        const stringfiedPayload = queryString.stringify(payload);

        // configure the https request details
        const reqDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',  // standard form being posted
                'Content-Length': Buffer.byteLength(stringfiedPayload) // get the byte length of the stringified payload
            }
        };

        // instantiate the request object
        const req = https.request(reqDetails, function(res){
            // Grab the status of the sent request
            const status =  res.statusCode;
            // Callback successfully if the request went through
            if (status === 200 || status === 201){
              callback(false);
            } else {
                callback(`Status code returned is ${status}`)
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

function computeRequestHandler(obj, trimmedPath) {
    let selectedRequestHandler;

    for (const key in obj) {
        if (obj.hasOwnProperty(key) && trimmedPath.includes(key)) {
            console.log('obj.hasOwnProperty(key) && trimmedPath.includes(key)');
            selectedRequestHandler = obj[key];
            break;
        } else {
            console.log('else');
            // if no route path matches, return the function associated with the 404 route
            selectedRequestHandler = obj['404']
        }
    }

    return selectedRequestHandler;
}

// get the string contents of a template
function getTemplate(templateName = '', data, callback) {
    templateName = isTypeOfValid(templateName, 'string') && templateName.length > 0 ? templateName : '';
    data = isTypeOfValid(data, 'object') && data !== null ? data : {};

    if (templateName) {
        const templateDir = path.join(__dirname, '/../templates/');
        
        fs.readFile(templateDir+templateName+'.html', 'utf-8', function(err, str) {
            if (!err && str && str.length > 0) {
                // do interpolation on the string before returning it
                const finalStr = interpolate(str, data);
                callback(false, finalStr)
            } else {
                callback('No template found');
            }
        });
    } else {
        callback('A valid template name was not specified')
    }
}

// add the global header and footer to a string and pass the provided data object to the header and footer for interpolation
function addGlobalTemplates(str, data, callback) {
    str = isTypeOfValid(str, 'string') && str.length > 0 ? str : '';
    data = isTypeOfValid(data, 'object') && data !== null ? data : {};

    // get the header
    getTemplate('_header', data, function(err, headerStr) {
        if (!err && headerStr) {
            // get the footer
            getTemplate("_footer", data, function(err, footerStr) {
                if (!err && footerStr) {
                    // add them all together
                    const combinedStr = headerStr+str+footerStr;
                    callback(false, combinedStr);
                } else {
                    callback("Could not find the footer template")
                }
            })
        } else {
            callback("Could not find the header template")
        }
    });
}

// take a given string and data object and find/replace all the keys within it
function interpolate(str, data) {
    str = isTypeOfValid(str, 'string') && str.length > 0 ? str : '';
    data = isTypeOfValid(data, 'object') && data !== null ? data : {};
    
    // add the template globals to the data object, prepending their key names with "globals"
    for (var keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.'+keyName] = config.templateGlobals[keyName]; 
        }
    }

    // for each key in the data object, insert its value into the string at the corresponding 
    for (var key in data) {
        if (data.hasOwnProperty(key) && typeof(data[key]) === 'string') {
            const replace = data[key];
            const find = `{${key}}`;
            str = str.replace(find, replace);
        }
    }
    return str;
}

module.exports = {
    isStringValid,
    hash,
    parseJSONToObject,
    isBoolValid,
    generateRandomString,
    isTypeOfValid,
    isInstanceOfArray,
    sendTwilioSms,
    computeRequestHandler,
    getTemplate,
    addGlobalTemplates,
    interpolate
}