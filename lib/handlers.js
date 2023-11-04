// Dependencies
const _users = require('./handlers/users');
const _token = require('./handlers/token');
const checksRouter = require('./handlers/checks');
const accountRouteObj = require('./handlers/account');
const sessionRouteObj = require('./handlers/session');
const helpers = require('../utils/helper');

// define the handlers
let handlers = {};

// HTML Handlers
handlers.index = function(data, callback) {
    // reject any request that isn't a GET request
    if (data.method !== 'get') {
        callback(405, undefined, 'html')
    } else {
        helpers.getTemplate('index', function(err, str) {
            if (!err && str) {
                callback(200, str, 'html')
            } else {
                callback(500, undefined, 'html')
            }
        })
    }
}

// JSON API Handlers
// handlers.index = function(data, callback) {
//     callback(undefined, undefined, 'html')
// }

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