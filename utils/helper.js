/* 
* helper functions 
*/
const crypto = require('crypto');
const config = require('../lib/config');
const queryString = require('querystring');
const https = require("https");
const path = require('path');
const fs = require('fs');

const helpers = {};

helpers.trimString = function(value, num = 0) {
    if (value.trim().length > num) {
        return true
    } else {
        return false
    }
}

helpers.isBoolValid = function(val) {
    if (typeof val !== 'boolean') {
        return false
    }
    return true
}

helpers.hash = function(value) {
    if (typeof value === 'string' && value.length > 0) {
        // hash with sha-256
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(value).digest('hex');
        return hash;
    } else {
        return false
    }
}

helpers.parseJSONToObject = function(str) {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (err) {
        return {}
    }
}

helpers.generateRandomString = function(num = 20) {
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

helpers.isTypeOfValid = function(value, type) {
    if (typeof (value) === type) {
        return true
    } else {
        return false
    }
}

helpers.isInstanceOfArray = function(item) {
    return item instanceof Array
}

helpers.sendTwilioSms = function (phone, msg, callback) {
    // validate phone and messge
    phone = helpers.isTypeOfValid(phone, "string") && helpers.trimString(phone, 10) ? phone.trim() : false;
    msg = helpers.isTypeOfValid(msg, "string") && helpers.trimString(msg, 0, 1600) ? msg.trim() : false;

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

helpers.computeRequestHandler = function(obj, trimmedPath) {
    let selectedRequestHandler;

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const modifiedKey = key.replace('api/', '');

            // console.log({ 
            //     trimmedPath, 
            //     'trimmedPath.split("/")[0]': trimmedPath.split("/")[0],
            //     key,
            //     modifiedKey 
            // });

            if (trimmedPath !== '' && (trimmedPath.split("/")[0] === modifiedKey || trimmedPath.split("/")[1] === modifiedKey)) {
                selectedRequestHandler = obj[key];
                break;
            } 
            
            if (trimmedPath === '' && trimmedPath.includes(modifiedKey)) {
                selectedRequestHandler = obj[key];
                break;
            } 
        } else {
            // if no route path matches, return the function associated with the 404 route
            selectedRequestHandler = obj['404']
        }
    }

    return selectedRequestHandler;
}

// get the string contents of a template
helpers.getTemplate = function(templateName = '', data, callback) {
    templateName = helpers.isTypeOfValid(templateName, 'string') && templateName.length > 0 ? templateName : '';
    data = helpers.isTypeOfValid(data, 'object') && data !== null ? data : {};

    if (templateName) {
        const templateDir = path.join(__dirname, '/../templates/');
        
        fs.readFile(templateDir+templateName+'.html', 'utf-8', function(err, str) {
            if (!err && str && str.length > 0) {
                // do interpolation on the string before returning it
                const finalStr = helpers.interpolate(str, data);
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
helpers.addGlobalTemplates = function(str, data, callback) {
    str = helpers.isTypeOfValid(str, 'string') && str.length > 0 ? str : '';
    data = helpers.isTypeOfValid(data, 'object') && data !== null ? data : {};

    // get the header
    helpers.getTemplate('_header', data, function(err, headerStr) {
        if (!err && headerStr) {
            // get the footer
            helpers.getTemplate("_footer", data, function(err, footerStr) {
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
helpers.interpolate = function(str, data) {
    str = helpers.isTypeOfValid(str, 'string') && str.length > 0 ? str : '';
    data = helpers.isTypeOfValid(data, 'object') && data !== null ? data : {};
    
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

// compare incoming http methods with a list of allowed http methods
helpers.checkAllowedMethods = function(method) {
    const allowedHttpsMethods = ['post', 'get', 'put', 'delete'];

    if (allowedHttpsMethods.indexOf(method) > -1) {
        return true
    } else {
        return false
    }
}

helpers.getStaticAssets = function(fileName, callback) {
    fileName = helpers.isTypeOfValid(fileName, 'string') ? fileName : ''
    if (fileName) {
        const publicDir = path.join(__dirname, '/../public/');
        fs.readFile(publicDir+fileName, function(err, data) {
            if (!err && data) {
                callback(false, data)
            } else {
                callback("no file was found")
            }
        })
    } else {
        callback("Invalid file name")
    }
}

helpers.toCamelCaseWithSpace = function(str) {
    return str.replace(/[" "](.)/g, function(match, group) {
        return group.toUpperCase();
      });
}

module.exports = helpers;