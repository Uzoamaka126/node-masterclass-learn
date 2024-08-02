const _users = require('./handlers/users');
const _token = require('./handlers/token');
const checksRouter = require('./handlers/checks');
const accountRouter = require('./handlers/account');
const sessionRouter = require('./handlers/session');

function mapRouteToHandlerObj(data, callback) {
    const routeName = data?.trimmedPath.replace("api/checks", "");

    if (routes[routeName]) {
        routes[routeName](data, callback)
    } else {
        callback(405)
    }
};

module.exports = {
    'users': _users,
    'token': _token,
    'checks': checksRouter,
    'account': accountRouter,
    'session': sessionRouter,
};
