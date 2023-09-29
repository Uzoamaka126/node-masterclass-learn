/*
* Primary file for the API
*
*/

// Dependencies
const server = require('./lib/server');
const backgroundWorkers = require('./lib/bgWorkers');

// Declare the app
const app = {};

app.init = function() {
    // use the server and workers files here
    // start the server
    server.init();

    // start the worker
    backgroundWorkers.init();
}

// execute the app
app.init();

// export the app
module.exports = app;
