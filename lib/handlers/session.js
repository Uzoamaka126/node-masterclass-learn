// Dependencies
const config = require('../config')
const helpers = require('../../utils/helper');
const _data = require('../data');
const _token = require('./token');

// define a single session handler object
const _session = {};

_session.post = function (data, callback) {
    const protocol = helpers.isTypeOfValid(data.payload.protocol, 'string') && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = helpers.isTypeOfValid(data.payload.url, 'string') && data.payload.url.trim().length > 0 ? data.payload.url : false;
    const method = helpers.isTypeOfValid(data.payload.method, 'string') && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1  ? data.payload.method : false;
    const successCodes = helpers.isTypeOfValid(data.payload.successCodes, 'object') && data.payload.successCodes instanceof Array  ? data.payload.successCodes : false;
    const timeoutSecs = helpers.isTypeOfValid(data.payload.timeoutSecs, 'number') && (data.payload.timeoutSecs % 1 === 0) && (data.payload.timeoutSecs >= 1 && data.payload.timeoutSecs <= 5)
        ? data.payload.timeoutSecs 
        : false;

  if(protocol && url && method && successCodes && timeoutSecs){    
    // Get token from headers
    const token = helpers.isTypeOfValid(data.headers['bearer'], "string") ? data.headers['bearer'] : false;
    
    // look up user via token
    _data.read('tokens', token, function (err, tokenData){
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
                            url,
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

_session.delete = function (data, callback) {
    const phone = typeof(data.queryStringObj.phone) === 'string' && data.queryStringObj.phone.trim().length > 0 ? data.queryStringObj.phone : false;
    const checkId = typeof(data.queryStringObj.id) === 'string' && data.queryStringObj.id.trim().length > 0 ? data.queryStringObj.id : false;

    if (phone) {
        // get the token
        const token = helpers.isTypeOfValid(data.headers['bearer'], "string") ? data.headers['bearer'] : false;

        // verify token is valid for the phone number
        _token.verifyToken({ id: token, phone }, function(isTokenValid) {                    
            if (isTokenValid) {
                // find specific check on the checks table. Everything else is contingent on the specific check being found
                _data.read('checks', checkId, function(err, checkData) {
                    if (!err && checkData) {
                        // read data from the user's table
                        _data.read('users', phone, function(err, userData) {
                            // if user exists, go ahead and remove the specific check from it first
                            if (!err && userData) {
                                const userChecks = helpers.isTypeOfValid(userData.checks, "object") && helpers.isInstanceOfArray(userData.checks) ? userData.checks : [];
                                
                                const newUserChecks = userChecks.filter(check => check.id !== checkId);
                                
                                // update user data with the modified checks array
                                _data.update('users', phone, { ...userData, checks: newUserChecks }, function(err) {
                                    if (!err) {
                                        _data.delete("checks", checkId, function(err) {
                                            if (!err) {
                                                callback(200, { Msg: "Successfully deleted check" })
                                            } else {
                                                callback(500, { Error: "An error occurred while deleting this check"})
                                            }
                                        })
                                    } else {
                                        callback(500, { Error: "An error occurred while updating user check data" })
                                    }
                                })
                            } else {
                                callback(400, {'Error' : 'Unable to find user' });
                            }
                        })
                    } else {
                        callback(400, {'Error' : 'Unable to find check' });
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

const sessionRouteObj = {
    'session/create': _session.post,
    'session/delete': _session.delete,
}
// export module
module.exports = sessionRouteObj;