// Dependencies
const helpers = require('../utils/helper');
const _data = require('../lib/data');
const _users = require('./handlers/users');
const _token = require('./handlers/token');
const _checks = require('./handlers/checks');

// define the handlers
let handlers = {};

handlers._users = _users;
handlers._token = _token;
handlers._checks = _checks;

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

handlers.token = function(data, callback) {
    const allowedHttpsMethods = ['post', 'get', 'put', 'delete'];

    if (allowedHttpsMethods.indexOf(data.method) > -1) {
        handlers._token[data?.method](data, callback)
    } else {
        callback(405)
    }
}

handlers.checks = function(data, callback) {
    const allowedHttpsMethods = ['post', 'get', 'put', 'delete'];

    if (allowedHttpsMethods.indexOf(data.method) > -1) {
        handlers._checks[data?.method](data, callback)
    } else {
        callback(405)
    }
}

// define the request router object
let router = {
    'ping': handlers.ping,
    '404': handlers.notFound,
    'api/users': handlers.users,
    'api/tokens': handlers.token,
    'api/checks': handlers.checks,
}

// export module
module.exports = router;