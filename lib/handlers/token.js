// Dependencies
const helpers = require('../../utils/helper');
const _data = require('../data')

// define a single token handler object
const _token = {};

// append properties to the token handler object
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

_token.put = function (data, callback) {
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

_token.delete = function (data, callback) {
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
module.exports = _token;