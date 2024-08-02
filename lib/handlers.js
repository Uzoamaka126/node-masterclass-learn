// Dependencies
const userRouter = require('./handlers/users');
const tokenRouter = require('./handlers/token');
const checksRouter = require('./handlers/checks');
const accountRouter = require('./handlers/account');
const sessionRouter = require('./handlers/session');
const helpers = require('../utils/helper');
const { templateData, routesProps } = require('../utils/data');

// define the handlers
let handlers = {};

function routeCheck(data, callback, next) {
    const path = data.trimmedPath;

    if (!routesProps[path]) {
        callback(404, { 'Error' : "url not found" })
    }

    if (!routesProps[path]?.methods.includes(data.method)) {
        callback(405)
    }

    if (data.method === "get") {
        const key = routesProps[path]?.key;

        const selectedTemplateData = templateData[key];

        helpers.getTemplate(key, selectedTemplateData, function(err, str) {
            if (!err && str) {
                // add the global templates
                helpers.addGlobalTemplates(str, selectedTemplateData, function(err, str) {
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
    } else {
        return next && next[data?.method](data, callback)
    }
}

// HTML Handlers
handlers.index = routeCheck(data, callback);

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

handlers.error = function(data, callback) {
    const err = new Error('error thrown');
    throw(err)
}

// handlers._users = _users;
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

handlers.users = routeCheck(data, callback, undefined, userRouter);
handlers.token = routeCheck(data, callback, undefined, tokenRouter);
handlers.checks = routeCheck(data, callback, undefined, checksRouter);
handlers.account = routeCheck(data, callback, undefined, accountRouter);
handlers.session = routeCheck(data, callback, undefined, sessionRouter);

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
    'public': handlers.public,
    'api/errorhandler': handlers.error,
};

module.exports = router;