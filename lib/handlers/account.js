// Dependencies
const helpers = require('../../utils/helper');

// define a single token handler object
const _account = {};

console.log('Account router hereeeee!');

_account.post = function (data, callback) {
    // reject any request method that isn't a GET request
    if (data.method !== 'get') {
        callback(405, undefined, 'html')
    } else {
        const templateData = {
            'head.title' : 'Create an Account',
            'head.description' : 'Signup is easy and only takes a few seconds.',
            'body.class' : 'accountCreate'
        };
        
        helpers.getTemplate('accountCreate', templateData, function(err, str) {
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
_account.get = function (data, callback) {
    console.log('This is the account get router function');
}

_account.put = function (data, callback) {
}

// move this to the user handler
_account.delete = function (data, callback) {
}

const accountRouteObj = {
    '/get': _account.get,
    '/create': _account.post,
    '/edit': _account.put,
    '/delete': _account.delete,
};

function accountRouter(data, callback) {
    const routeName = data?.trimmedPath.replace("api/account", "");
    const clientRouteName = data?.trimmedPath.replace("account", "");

    if (accountRouteObj[routeName]) {
        accountRouteObj[routeName](data, callback)
    } else if (accountRouteObj[clientRouteName]) {
        accountRouteObj[clientRouteName](data, callback)
    } else {
        callback(405)
    }
};

// export module
module.exports = accountRouter;