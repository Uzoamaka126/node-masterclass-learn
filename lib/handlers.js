// Dependencies
const _users = require('./handlers/users');
const _token = require('./handlers/token');
const checksRouter = require('./handlers/checks');
const accountRouter = require('./handlers/account');
const sessionRouter = require('./handlers/session');
const helpers = require('../utils/helper');

// define the handlers
let handlers = {};

// HTML Handlers
handlers.index = function(data, callback) {
    // reject any request method that isn't a GET request
    if (data.method !== 'get') {
        callback(405, undefined, 'html')
    } else {
        // prepare data for interpolation
        const templateData = {
            'head.title': 'Head Title',
            'head.description': 'Head Description',
            'body.title': 'And we are live!',
            'body.class': 'index',
        };
        
        helpers.getTemplate('index', templateData, function(err, str) {
            if (!err && str) {
                // add the global templates
                helpers.addGlobalTemplates(str, templateData, function(err, str) {
                    if (!err && str) {
                        // return the page as html
                        callback(200, str, 'html')
                    } else {
                        callback(500, undefined, 'html')
                    }
                })
            } else {
                callback(500, undefined, 'html')
            }
        })
    }
}

handlers.favicon = function(data, callback) {
    if (data.method === 'get') {
        // read in the favicon's helper
        helpers.getStaticAssets('favicon.ico', function(err, data) {
            if (!err && data) {
            // callback the data
            callback(200, data, 'favicon')
            } else {
                callback(500)
            }
        })
    } else {
        callback(405)
    }
}

// server public assets
handlers.public = function(data, callback) {
    if (data.method === 'get') {
        // get the filename being requested
        const trimmedAssetName = data.trimmedPath.replace('public', '');

        if (trimmedAssetName.length > 0) {
            // read in the assets data
            helpers.getStaticAssets(trimmedAssetName, function(err, data) {
                if (!err && data) {
                    // determine what type of file extension we are serving (default to plain text)
                    let contentType = 'plain';

                    if (trimmedAssetName.indexOf('.css') > -1) {
                        contentType = 'css';
                    }

                    if (trimmedAssetName.indexOf('.png') > -1) {
                        contentType = 'png';
                    }
                    if (trimmedAssetName.indexOf('.jpeg') > -1) {
                        contentType = 'jpeg';
                    }
                    if (trimmedAssetName.indexOf('.ico') > -1) {
                        contentType = 'favicon';
                    }

                    // callback the data
                    callback(200, data, contentType)
                } else {
                    callback(404)
                }
            })
        } else {
            callback(404)
        }
    } else {
        callback(405)
    }
}

handlers._users = _users;
handlers._token = _token;

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
    const isMethodAllowed = helpers.checkAllowedMethods(data.method);

    if (isMethodAllowed) {
        checksRouter(data, callback)
    } else {
        callback(405)
    }
}

handlers.account = function(data, callback) {
    const isMethodAllowed = helpers.checkAllowedMethods(data.method);

    if (isMethodAllowed) {
        accountRouter(data, callback)
    } else {
        callback(405)
    }
}

handlers.session = function(data, callback) {
    const isMethodAllowed = helpers.checkAllowedMethods(data.method);

    if (isMethodAllowed) {
        sessionRouter(data, callback)
    } else {
        callback(405)
    }
}

// define the request router object
const router = {
    '/': handlers.index,
    'ping': handlers.ping,
    '404': handlers.notFound,
    'api/users': handlers.users,
    'api/tokens': handlers.token,
    'api/checks': handlers.checks,
    'api/account': handlers.account,
    'api/session': handlers.session,
    'favicon.ico': handlers.favicon,
    'public': handlers.public
}

// export module
module.exports = router;