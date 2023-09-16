// Dependencies
const helpers = require('../utils/helper');
const _data = require('../lib/data')

// define the handlers
let handlers = {};

// data is the request payload
// callback is the function we want to call once the handlers complete running

// Sample handler
handlers.ping = function(data,callback) {
   callback(200);
};

// NotFound or default handler
handlers.notFound = function (data, callback) {
   callback(404)
};

handlers.users = function (data, callback) {
    const allowedHttpsMethods = ['post', 'get', 'put', 'delete'];

    if (allowedHttpsMethods.indexOf(data.method) > -1) {
        handlers._users[data?.method](data, callback)
    } else {
        callback(405)
    }
}

handlers._users = {};

/**
 * handles all post requests on the /users route
 *
 * @param  {Object} data
 * @param  {Function} callback any callback function
 * @return {undefined} 
 */
handlers._users.post = function (data, callback) {
    // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 5 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if(firstName && lastName && phone && password && tosAgreement){
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
handlers._users.get = function (data, callback) {
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

handlers._users.put = function (data, callback) {
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

handlers._users.delete = function (data, callback) {
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

// define the request router object
let router = {
    'ping': handlers.ping,
    '404': handlers.notFound,
    'users': handlers.users
}

// export module
module.exports = router;