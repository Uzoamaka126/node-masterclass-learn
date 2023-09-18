// Dependencies
const config = require('../config')
const helpers = require('../../utils/helper');
const _data = require('../data')

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
    const id = typeof(data.queryStringObj.id) === 'string' && data.queryStringObj.id.trim().length === 20 ?  data.queryStringObj.id : false;

    if (id) {
        // perform a lookup of the token
        _data.read('tokens', id, function(err, tokenData) {
            if (!err && tokenData) {
                callback(200, tokenData)
                
            } else {
                callback(404, { Error: 'token not found or expired' } )
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required fields' })
    }
}

_checks.put = function (data, callback) {
    // check for the required field
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id : false;
    const isExtend = typeof(data.payload.isExtend) === 'boolean' && data.payload.isExtend ? data.payload.isExtend : false;

    if (id && isExtend) {
        // check to see if the user exists
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                // check to see that the token isn't already expired
                if (tokenData?.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // store the new updates
                    _data.update('tokens', id, tokenData, function(err) {
                        if (err) {
                            callback(400, { Error: 'Unable to extend token' })
                        } else {
                            callback(200, { msg: "token extended", tokenData });
                        }
                    })
                } else {
                    callback(400, { Error: "Token has expired" });
                }
            } else {
                callback(400, { Error: 'Token does not exist' })
            }
        })
    } else {
        callback(400, {'Error' : 'Missing or invalid required fields' });
    }
}

_checks.delete = function (data, callback) {
    const id = typeof(data.queryStringObj.id) === 'string' && data.queryStringObj.id.trim().length === 20 ? data.queryStringObj.id : false;

    if (id) {
        // lookup the token
        _data.read('tokens', id, function(err) {
            if (!err) {
                _data.delete("tokens", id, function(err) {
                    if (!err) {
                        callback(200, { msg: 'token deleted successfully' })
                    } else {
                        callback(404, {'Error' : 'Unable to delete token' });
                    }
                })
            } else {
                callback(404, {'Error' : 'token does not exist' });
            }
        })
    } else {
        callback(400, {'Error' : 'Missing token id required' });
    }
}

// export module
module.exports = _checks;