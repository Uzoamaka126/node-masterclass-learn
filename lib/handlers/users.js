// Dependencies
const helpers = require('../../utils/helper');
const _data = require('../data');
const tokenHandler = require('./token');

// define the handlers
const _users = {};

/**
 * handles all post requests on the /users route
 *
 * @param  {Object} data
 * @param  {Function} callback any callback function
 * @return {undefined} 
 */
_users.post = function (data, callback) {
    // Check that all required fields are filled out
  const firstName = helpers.isTypeOfValid(data.payload.firstName, 'string') && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = helpers.isTypeOfValid(data.payload.lastName, 'string') && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = helpers.isTypeOfValid(data.payload.phone, 'string') && data.payload.phone.trim().length > 5 ? data.payload.phone.trim() : false;
  const password = helpers.isTypeOfValid(data.payload.password, 'string') && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = helpers.isTypeOfValid(data.payload.tosAgreement, 'boolean') && data.payload.tosAgreement == true ? true : false;
  
  if (firstName && lastName && phone && password && tosAgreement){
    // Make sure the user doesnt already exist
    _data.read('users', phone, function (err, data){
      if (err){
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword){
          const userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users',phone,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }
      } else {
        // User already exists
        callback(400,{'Error' : 'A user with that phone number already exists'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }
}

// @TODO: only let authenticated user access their object
_users.get = function (data, callback) {
    const phone = typeof(data.queryStringObj.phone) === 'string' && data.queryStringObj.phone;

    if (phone) {
        // grab the token from the header request object
        const token = data.headers['bearer'] ? data.headers['bearer'] : false;

        // verify that the give token from the headers is valid;
        tokenHandler.verifyToken({ id: token, phone }, function(err) {
            if (!err || err !== 400) {
                // perform a lookup on the specified user
                _data.read('users', phone, function(err, data) {
                    if (err) {
                        callback(404, {
                            Error: 'User not found'
                        })
                    } else {
                        // remove user's hashed password
                        delete data.hashedPassword;
                        callback(200, data)
                    }
                })
            } else {
                callback(403, { Error: 'Missing required fields in header' })
            }
        })

    } else {
        callback(400, { 'Error': 'Missing required fields' })
    }
}

_users.put = function (data, callback) {
    // check for the required field
    const phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim() ? data.payload.phone : false;
    const firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim() ? data.payload.firstName : false;
    const lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim() ? data.payload.lastName : false;
    const password = typeof (data.payload.password) === 'string' && data.payload.password.trim() ? data.payload.password : false;

    if (phone) {
        // grab the token from the header request object
        const token = data.headers['Bearer'] ? data.headers['Bearer'] : false;

        // verify that the give token from the headers is valid;
        tokenHandler.verifyToken({ id: token, phone }, function(isTokenValid) {
            if (isTokenValid) {
                // check to see if the user exists
                _data.read('users', phone, function (err) {
                    if (err) {
                        callback(404, {'Error' : 'User or file not found'});
                    } else {
                        if (!firstName || !lastName || !phone || !password) {
                            callback(400, {'Error' : 'Missing required fields' });
                        } else {
                            const userData = { firstName, lastName, phone };
                            userData.password = helpers.hash(password);
            
                            // hash password before saving 
                            _data.update('users', phone, userData, function(err) {
                                if (err) {
                                    callback(400, { Error: 'Unable to update user' })
                                } else {
                                    callback(200, { msg: "user info updated", userData });
                                }
                            })
                        }
                    }
                })
            } else {
                callback(403, { Error: 'Missing required fields in header' })
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields' });
    }
}

_users.delete = function (data, callback) {
    const phone = typeof (data.queryStringObj.phone) === 'string' && data.queryStringObj.phone.trim() ? data.queryStringObj.phone : false;

    if (phone) {
        // grab the token from the header request object
        const token = data.headers['Bearer'] ? data.headers['Bearer'] : false;

        // verify that the give token from the headers is valid;
        tokenHandler.verifyToken({ id: token, phone }, function(isTokenValid) {
            if (isTokenValid) {
                _data.read('users', phone, function(err) {
                    if (!err) {
                        _data.delete("users", phone, function(err) {
                            if (!err) {
                                callback(200, { msg: 'User deleted successfully' })
                            } else {
                                callback(404, {'Error' : 'Unable to delete user' });
                            }
                        })
                    } else {
                        callback(404, {'Error' : 'User does not exist' });
                    }
                })
            } else {
                callback(400, {'Error' : 'Missing required fields' });
            }
        })
    } else {
        callback(400, {'Error' : 'Missing phone number identifier required' });
    }
}

// export module
module.exports = _users;