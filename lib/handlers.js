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
 * @param  {Object} data a JavaScript 2d array
 * @param  {Function} callback any callback function
 * @return {undefined} 
 */
handlers._users.post = function(data, callback) {
    // check that all required fields are met
    const isFirstNameValid = helpers.isStringValid(data?.payload, "firstName")
    const isLastNameValid = helpers.isStringValid(data?.payload, "lastName");
    const isPhoneNumValid = helpers.isStringValid(data?.payload, "phone");
    const isPasswordValid = helpers.isStringValid(data?.payload, "password", 11);
    const isTermsAndAgreementValid = helpers.isStringValid(data?.payload, "termsAndAgreement", 11); 
    
    if (isFirstNameValid && isLastNameValid && isPasswordValid && isPhoneNumValid && helpers.isStringValid && isTermsAndAgreementValid) {
        // make sure that the user doesn't already exist
        // read from the users data to do that
        _data.read('users', data?.payload.phone, function(err, data) {
            if (err) {
                callback(400, { 'Error': 'This phone number already exists' })
            } else {
                // hash the password
                var hashedPassword = helpers.hash()
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required fields' })
    }
}

handlers._users.get = function(data, callback) {
    
}

handlers._users.put = function(data, callback) {
    
}

handlers._users.delete = function(data, callback) {
    
}

// define the request router object
let router = {
    'ping': handlers.ping,
    '404': handlers.notFound
}

// export module
module.exports = router;