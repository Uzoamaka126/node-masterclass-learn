// Dependencies
const helpers = require('../../utils/helper');
const _data = require('../data')

// define the handlers
const _token = {};

/**
 * handles all post requests on the /users route
 *
 * @param  {Object} data
 * @param  {Function} callback any callback function
 * @return {undefined} 
 */
_token.post = function (data, callback) {
    // Check that all required fields are filled out
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 5 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if(phone && password){
    // Make sure the user doesnt already exist
    _data.read('users', phone, function (err, userData){
      if (!err && userData){
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword){
           const storedPassword = userData?.hashedPassword;

           if (hashedPassword === storedPassword) {
                // create a new token. Set expiration date 1 hour ahead
                const tokenId = helpers.generateRandomString(20);

                const expiryTime = Date.now() + 1000 * 60 * 60;
                const tokenObj = { phone, id: tokenId, expires: expiryTime };

                // store token in the token file
                _data.create('tokens', tokenId, tokenObj, function(err) {
                    console.log({ err });
                    if (!err) {
                        callback(200, tokenObj)
                    } else {
                        callback(500, { Error: 'Could not create token'})
                    }
                })
           } else {
            callback(400, { 'Error' : 'This password does not match what we have' } );
           }          
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }
      } else {
        callback(400,{'Error' : 'Could not find the specified user'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }
}

// @TODO: only let authenticated user access their object
_token.get = function (data, callback) {
    const phone = typeof(data.queryStringObj.phone) === 'string' && data.queryStringObj.phone;

    if (phone) {
        // perform a lookup
        _data.read('users', phone, function(err, data) {
            if (err) {
                console.log({ err });
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
        callback(400, { 'Error': 'Missing required fields' })
    }
}

_token.put = function (data, callback) {
    // check for the required field
    const phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim() ? data.payload.phone : false;
    const firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim() ? data.payload.firstName : false;
    const lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim() ? data.payload.lastName : false;
    const password = typeof (data.payload.password) === 'string' && data.payload.password.trim() ? data.payload.password : false;

    if (phone) {
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
        callback(400, {'Error' : 'Missing required fields' });
    }
}

_token.delete = function (data, callback) {
    const phone = typeof (data.queryStringObj.phone) === 'string' && data.queryStringObj.phone.trim() ? data.queryStringObj.phone : false;

    if (phone) {
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
        callback(400, {'Error' : 'Missing phone number identifier required' });
    }
}

// export module
module.exports = _token;