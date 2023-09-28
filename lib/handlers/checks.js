// Dependencies
const config = require('../config')
const helpers = require('../../utils/helper');
const _data = require('../data');
const _token = require('./token');

// define a single token handler object
const _checks = {};

// append properties to the token handler object
/* 
* checks - post
* required data: protocol, url, method, success codes and timeout (in seconds)
* optional data: none
*/
_checks.post = function (data, callback) {
    const protocol = helpers.isTypeOfValid(data.payload.protocol, 'string') && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = helpers.isTypeOfValid(data.payload.url, 'string') && data.payload.url.trim().length > 0 ? data.payload.protocol : false;
    const method = helpers.isTypeOfValid(data.payload.method, 'string') && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1  ? data.payload.protocol : false;
    const successCodes = helpers.isTypeOfValid(data.payload.successCodes, 'object') && data.payload.successCodes instanceof Array  ? data.payload.successCodes : false;
    const timeoutSecs = helpers.isTypeOfValid(data.payload.timeoutSecs, 'number') && (data.payload.timeoutSecs % 1 === 0) && (data.payload.timeoutSecs >= 1 && data.payload.timeoutSecs <= 5)
        ? data.payload.timeoutSecs 
        : false;

  if(protocol && url && method && successCodes && timeoutSecs){
    // check that the user has provided a token in the headers
    
    // Get token from headers
    const token = helpers.isTypeOfValid(data.headers['bearer'], "string") ? data.headers['bearer'] : false;
    
    // look up user via token
    _data.read('tokens', token, function (err, tokenData){
        console.log({ tokenData, token });
      if (!err && tokenData) {       
            const userPhone = tokenData?.phone;

            // then lookup the user data
            _data.read('users', userPhone, function (err, userData){
                if (!err && userData) {
                    const checks = helpers.isTypeOfValid(userData?.checks, "object") && helpers.isInstanceOfArray(userData?.checks) ? userData?.checks : [];

                    if (checks.length < config.maxChecks) {
                        const checkId = helpers.generateRandomString(20);

                        // create a check object and store it in reference to the user; key-value stores
                        const checkObj = {
                            id: checkId,
                            userPhone,
                            protocol,
                            successCodes,
                            method,
                            timeoutSecs
                            // @TODO: add more keys as background wrokers start to process these checks
                        }

                        // persist the object above to disk
                        _data.create('checks', checkId, checkObj, function(err) {
                            if (!err) {
                                // add new check id to user's table once this check has been added to the checks table. Run a sync up
                                userData.checks = checks;
                                userData.checks.push(checkObj);

                                // add/update a check id to the user object
                                _data.update("users", userPhone, userData, function(err) {
                                    if (!err) {
                                        // return the newly created check
                                        callback(201, checkObj)
                                    } else {
                                        callback(500, { 'Error' : 'Unable to update user checks' });
                                    }
                                })
                            } else {
                                callback(500, { 'Error' : 'Unable to create check' });
                            }
                        })
                    } else {
                        callback(400, { 'Error' : `Maximum checks (${config.maxChecks}) reached for this user` });
                    }
                } else {
                    callback(400, { 'Error' : 'User not found' });
                } 
            })     
      } else {
        callback(400, { 'Error' : 'Missing or invalid token' });
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required inputs'});
  }
}

// @TODO: only let authenticated user access their object
_checks.get = function (data, callback) {
    // check that the token id is valid
    const id = helpers.isTypeOfValid(data.queryStringObj.id, 'string') && data.queryStringObj.id.trim().length === 20 ?  data.queryStringObj.id : false;
    const token = helpers.isTypeOfValid(data.headers['bearer'], "string") ? data.headers['bearer'] : false;

    if (id && token) {
        _data.read('checks', id, function(err, checkData) {
            if (!err && checkData) {
                // verify token before returning the check data
                _token.verifyToken({ id: token, phone: checkData?.userPhone }, function(isTokenValid) {
                    if (isTokenValid) {
                        // return the check data
                        callback(200, checkData)
                    } else {
                        callback(400, { 'Error': 'Missing or invalid token' })
                    }
                })
            } else {
                callback(403, { 'Error': 'Unable to read/check check file' })
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required headers or query params' })
    }
}

// Required data: id
// optional data: id, url, protocol, success codes, method & timeoutSecs
_checks.put = function (data, callback) {
    // check for the required fields
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id : false;
    // check for the optional fields
    const url = helpers.isTypeOfValid(data.payload.url, 'string') ? data.payload.url : false;
    const protocol = helpers.isTypeOfValid(data.payload.protocol, 'string') ? data.payload.protocol : false;
    const successCodes = helpers.isTypeOfValid(data.payload.successCodes, 'object') && helpers.isInstanceOfArray(data?.payload.successCodes) ? data.payload.successCodes : [];
    const method = helpers.isTypeOfValid(data.payload.method, 'string') ? data.payload.method : false;
    const timeoutSecs = helpers.isTypeOfValid(data.payload.timeoutSecs, 'number') ? data.payload.timeoutSecs : false;
    const userPhone = helpers.isTypeOfValid(data.payload.userPhone, 'string') ? data.payload.userPhone : false;

    const updatePayload = { id, url, protocol, method, successCodes, timeoutSecs, userPhone };

    if (id) {
        // check to see if one or more optional fields have been met
        if (url || protocol || successCodes || method || timeoutSecs || userPhone) {
            _data.read('checks', id, function (err, checkData) {
                if (!err && checkData) {
                    const token = helpers.isTypeOfValid(data.headers['bearer'], "string") ? data.headers['bearer'] : false;

                    // verify token before returning the check data
                    _token.verifyToken({ id: token, phone: userPhone }, function(isTokenValid) {
                        if (isTokenValid) {
                            // update the check table
                            _data.update('checks', id, updatePayload, function(err) {
                                if (err) {
                                    callback(400, { Error: 'Unable to update check' })
                                } else {
                                    callback(200, { msg: "Check updated" });
                                }
                            })
                        } else {
                            callback(403, { 'Error': 'Missing or invalid token' })
                        }
                    })
                } else {
                    callback(403, { 'Error': 'Unable to get check' })
                }
            })
        } else {
            callback(400, {'Error' : 'Missing payload data' });
        }
    } else {
        callback(400, {'Error' : 'Missing required fields' });
    }
}

// move this to the user handler
// we need to delete the check from the check table and then delete the check from the user's object
_checks.delete = function (data, callback) {
    const phone = typeof(data.queryStringObj.phone) === 'string' && data.queryStringObj.phone.trim().length === 20 ? data.queryStringObj.phone : false;

    if (phone) {
        // get the token
        const token = helpers.isTypeOfValid(data.headers['bearer'], "string") ? data.headers['bearer'] : false;

        // verify token is valid for the phone number
        _token.verifyToken({ id: token, phone }, function(isTokenValid) {                    
            if (isTokenValid) {
                _data.read('users', phone, function(err, userData) {
                    if (!err && userData) {
                        // delete the check from the checks and users table
                        _data.delete("users", phone, function(err) {
                            if (!err) {
                                // delete each of the checks assigned to the user
                                const userChecks = helpers.isTypeOfValid(userData?.checks, "object") && helpers.isInstanceOfArray(userData?.checks) ? userData?.checks : [];
                                const checksToDelete = userChecks.length;

                                if (checksToDelete > 0) {
                                    let deletedChecks = 0; 
                                    let isErrorDeleting = false;

                                    userChecks.forEach(function(checkId) {
                                        // delete each check passed by id
                                        _data.delete("checks", checkId, function(err) {
                                            if (!err) {
                                                isErrorDeleting = true;
                                            }
                                            checksToDelete++;
                                            if (deletedChecks === checksToDelete) {
                                                if (!isErrorDeleting) {
                                                    callback(200)
                                                } else {
                                                    callback(500, { Error: "An error occurred during checks deletion"})
                                                }
                                            }
                                        })
                                    })
                                }
                            } else {
                                callback(404, {'Error' : 'Unable to delete user' });
                            }
                        })
                    } else {
                        callback(400, {'Error' : 'Unable to find user' });
                    }
                })
            } else {
                callback(403, { 'Error': 'Missing or invalid token' })
            }
        })
    } else {
        callback(400, {'Error' : 'Missing user phone id required' });
    }
}

// export module
module.exports = _checks;