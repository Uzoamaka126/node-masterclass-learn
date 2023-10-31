// Dependencies
const _users = require('./handlers/users');
const _token = require('./handlers/token');
const checksRouter = require('./handlers/checks');
const accountRouteObj = require('./handlers/account');
const sessionRouteObj = require('./handlers/session');

// define the handlers
let handlers = {};

handlers._users = _users;
handlers._token = _token;
handlers._account = accountRouteObj;
handlers._session = sessionRouteObj;

// data is the request payload
// callback is the function we want to call once the handlers complete running

// Sample handler
handlers.ping = function(data,callback) {
   callback(200);
};

// NotFound or default handler
handlers.notFound = function (data, callback) {
   callback(404, {'Error' : `Url: ${data.headers.host}/${data.trimmedPath} not found` })
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
        checksRouter(data, callback)
    } else {
        callback(405)
    }
}

// define the request router object
let router = {
    '': handlers.index,
    // ...handlers._account,
    // ...handlers._session,
    'ping': handlers.ping,
    '404': handlers.notFound,
    'api/users': handlers.users,
    'api/tokens': handlers.token,
    'api/checks': handlers.checks,
}

// export module
module.exports = router;