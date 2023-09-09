// define the handlers
let handlers = {};

// data is the request payload
// callback (cb) is the function we want to call once the handlers complete running

// Sample handler
handlers.ping = function(data, cb) {
    cb(200);
};

// NotFound or default handler
handlers.notFound = function (data, cb) {
    cb(404)
};

// define the request router object
let router = {
    'ping': handlers.ping,
    '404': handlers.notFound
}

module.exports = router;