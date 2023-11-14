// Dependencies
const helpers = require('../../utils/helper');

// define a single session handler object
const _session = {};

console.log('Session router hereeeee!');

_session.post = function (data, callback) {
    // reject any request method that isn't a GET request
    if (data.method !== 'get') {
        callback(405, undefined, 'html')
    } else {
        const templateData = {
            'head.title': 'Login to your account.',
            'head.description': 'Please enter your phone number and password to access your account.',
            'body.class': 'sessionCreate'
        };
        
        helpers.getTemplate('sessionCreate', templateData, function(err, str) {
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

// @TODO: only let authenticated user access their object
_session.get = function (data, callback) {
    console.log('This is the session get router function');
}

_session.put = function (data, callback) {
}

// move this to the user handler
_session.delete = function (data, callback) {
    if (data.method !== 'get') {
        callback(405, undefined, 'html')
    } else {
        const templateData = {
            'head.title': 'Logged out.',
            'head.description': 'You have been logged out of your session.',
            'body.class': 'sessionDeleted'
        };
        
        helpers.getTemplate('sessionDeleted', templateData, function(err, str) {
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

const sessionRouteObj = {
    '/get': _session.get,
    '/create': _session.post,
    '/edit': _session.put,
    '/delete': _session.delete,
};

function sessionRouter(data, callback) {
    const routeName = data?.trimmedPath.replace("api/session", "");
    const clientRouteName = data?.trimmedPath.replace("session", "");

    if (sessionRouteObj[routeName]) {
        sessionRouteObj[routeName](data, callback)
    } else if (sessionRouteObj[clientRouteName]) {
        sessionRouteObj[clientRouteName](data, callback)
    } else {
        callback(405)
    }
};

// export module
module.exports = sessionRouter;