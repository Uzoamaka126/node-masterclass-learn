// Dependencies
const config = require('../config')
const helpers = require('../../utils/helper');
const _data = require('../data');
const _token = require('./token');

// define a single session handler object
const _session = {};

// append properties to the token handler object
/* 
* required data: protocol, url, method, success codes and timeout (in seconds)
* optional data: none
*/
_session.post = function (data, callback) {}

// @TODO: only let authenticated user access their object
_session.get = function (data, callback) {}

// Required data: id
// optional data: id, url, protocol, success codes, method & timeoutSecs
_session.put = function (data, callback) {}

// move this to the user handler
_session.delete = function (data, callback) {};

const sessionRouteObj = {
    '/get': _session.get,
    '/all': _session.get,
    '/create': _session.post,
    '/edit': _session.put,
    '/delete': _session.delete,
};

function sessionRouter(data, callback) {
    const routeName = data?.trimmedPath.replace("api/session", "");

    if (sessionRouteObj[routeName]) {
        sessionRouteObj[routeName](data, callback)
    } else {
        callback(405)
    }
};

// export module
module.exports = sessionRouter;