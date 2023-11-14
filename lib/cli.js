// For all CLI related tasks

// Define dependencies
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
class _events extends events{};
const e = new _events;

// instantiate the CLI module object
const cli = {};

cli.init = function() {
    // send the start message to the console with a dark blue colour
    console.log('\x1b[34m%s\x1b[0m', "The CLI is listening");

    // start the interface
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '>'
    })

    // manually create an initial prompt
    _interface.prompt()
}



module.exports = cli;