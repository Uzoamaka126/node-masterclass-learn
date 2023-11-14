/*
* Primary file for the API
*
*/

// Dependencies
const server = require('./lib/server');
const backgroundWorkers = require('./lib/bgWorkers');
const cli = require('./lib/cli');

// Declare the app
const app = {};

app.init = function() {
    // use the server and workers files here
    // start the server
    server.init();

    // start the worker
    backgroundWorkers.init();

    // start the CLI
   setTimeout(() => {
        cli.init();
   }, 50)
}

// execute the app
app.init();

// export the app
module.exports = app;
