/*
* Primary file for the server
*
*/

// Dependencies
const http = require("http");
const url = require("url");
const StringDecoder = require('string_decoder').StringDecoder;
const router = require('./handlers');
const config = require('./config');
const fs = require('fs');
const helpers = require('../utils/helper');
const _data = require('./data');
const path = require('path');

// instantiate the server module object
const server = {};

server.router = router;

// Testing
// @TODO delete this afterwards
// _data.create('test', 'newFile', { foo: 'bar' }, function(err) {
//     console.log({ err });
// })

// _data.read('test', 'newFile', function(err) {
//     console.log({ err });
// })

// @TODO REMOVE THIS
// helpers.sendTwilioSms('4158375309', 'Hello!', function(err) {
//     console.log({ errOccurred: err });
// })

server.httpsServerOptions = {
    // 'key': fs.readFileSync('./https/key.pem'), // modify paths because they are invalid
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cer': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

// create a server: turns your computer into an HTTP server
// Instantiate the http server
server.httpServer = http.createServer(function(req, res) {
    server.unifiedServer(req, res)
})

// Instantiate the http server
server.httpsServer = http.createServer(server.httpsServerOptions, function(req, res) {
    server.unifiedServer(req, res)
})

// all the server logic for both the http and https server
// handling the requests and responses that comes from the server
server.unifiedServer = function(req, res) {
    // Get the url and parse it. Every single time the request comes in, this is hit brand new
    const parsedUrl = url.parse(req.url, true)

    // Get the path; the untrimmed path that a user requests
    const path = parsedUrl.pathname;
    
    // trim off any unwanted slashes from the path
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')

    // get the query string as an object
    const queryStringObj = parsedUrl.query;

    // get the headers as an object
    const headers = req.headers;

    // get HTTP method
    const method = req.method.toLowerCase();

    // get payload, if any
    const decoder = new StringDecoder('utf-8')
    let buffer = ''; // as a normal utf string

    // bind to an event that the request obj emits
    req.on('data', function(data) {
        // use the decoder to turn that into a simple string
        buffer += decoder.write(data);
    });

    req.on('end', function() {
        // cap off the buffer with whatever the decoder ends with
        buffer += decoder.end();

        const computeRequestHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : server.router['404'];

        // construct the data object to send to the handler
        const data = {
            trimmedPath,
            queryStringObj,
            method,
            headers,
            // make sure that the payload coming in is a parsed JSON
            payload: helpers.parseJSONToObject(buffer)
        }

        // Route the request to the handler specified in the router
        computeRequestHandler(data, function(statusCode, payload) {
            console.log({ statusCode, payload });
            statusCode = typeof statusCode === 'number' ? statusCode : 200;

            // use the payload called back by the handler, or default to 
            payload = typeof payload === 'object' ? payload : {}

            // convert payload to a string
            const stringResponsePayload = JSON.stringify(payload);

            // set header
            res.setHeader('Content-Type', 'Application/JSON')

            // return the response
            res.writeHead(statusCode);

            // end the response
            res.end(stringResponsePayload)
        })
    })
}

server.init = function() {
    // start the HTTP server
    server.httpServer.listen(config.httpPort, function() {
        console.log('\x1b[36m%s\x1b[0m', `Server is running on ${config.httpPort}`);

    })
    
    // start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function() {
        console.log('\x1b[35m%s\x1b[0m', `Server is running on ${config.httpsPort}`);

    })
}

// export the module
module.exports = server;