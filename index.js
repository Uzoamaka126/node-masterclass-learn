/*
* Primary file for the API
*
*/

// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require('string_decoder').StringDecoder;
const router = require('./lib/handlers');
const config = require('./lib/config');
const fs = require('fs');
const helpers = require('./utils/helper');
const _data = require('./lib/data')

// Testing
// @TODO delete this afterwards
// _data.create('test', 'newFile', { foo: 'bar' }, function(err) {
//     console.log({ err });
// })

// _data.read('test', 'newFile', function(err) {
//     console.log({ err });
// })

// _data.update('test', 'newFile', { fizz: 'buzz' }, function(err) {
//     console.log({ err });
// })

// _data.delete('test', 'newFile', function(err) {
//     console.log({ err });
// })

// @TODO REMOVE THIS
helpers.sendTwilioSms('+')

const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cer': fs.readFileSync('./https/cert.pem')
};

// create a server: turns your computer into an HTTP server
// Instantiate the http server
const httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res)
})

// start the http server
httpServer.listen(config.httpPort, function() {
    console.log(`Server is running on ${config.httpPort}`)
})

// Instantiate the http server
const httpsServer = http.createServer(httpsServerOptions, function(req, res) {
    unifiedServer(req, res)
})

// start the https server
httpsServer.listen(config.httpsPort, function() {
    console.log(`Server is running on ${config.httpsPort}`)
})

// all the server logic for both the http and https server
// handling the requests and responses that comes from the server
const unifiedServer = function(req, res) {
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

        const computeRequestHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : router['404'];

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