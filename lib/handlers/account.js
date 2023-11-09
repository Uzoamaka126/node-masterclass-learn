// Dependencies
const config = require('../config')
const helpers = require('../../utils/helper');
const _data = require('../data');
const _token = require('./token');

// define a single token handler object
const _account = {};

// append properties to the token handler object
/* 
* checks - post
* required data: protocol, url, method, success codes and timeout (in seconds)
* optional data: none
*/
_account.post = function (data, callback) {

}

// @TODO: only let authenticated user access their object
_account.get = function (data, callback) {
}

// Required data: id
// optional data: id, url, protocol, success codes, method & timeoutSecs
_account.put = function (data, callback) {
}

// move this to the user handler
_account.delete = function (data, callback) {
}

const accountRouteObj = {
    '/get': _account.get,
    '/all': _account.get,
    '/create': _account.post,
    '/edit': _account.put,
    '/delete': _account.delete,
};

function accountRouter(data, callback) {
    const routeName = data?.trimmedPath.replace("api/account", "");

    if (accountRouteObj[routeName]) {
        accountRouteObj[routeName](data, callback)
    } else {
        callback(405)
    }
};


// export module
module.exports = accountRouter;