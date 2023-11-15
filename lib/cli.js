// For all CLI related tasks

// Define dependencies
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
const helpers = require('../utils/helper');
class _events extends events{};
const e = new _events;

// instantiate the CLI module object
const cli = {};

// input handlers
e.on('man', function(str) {
    cli.responders.help()
});

e.on('help', function(str) {
    cli.responders.help()
});

e.on('exit', function(str) {
    cli.responders.exit()
});

e.on('stats', function(str) {
    cli.responders.stats()
});

e.on('list users', function(str) {
    cli.responders.listUsers()
});

e.on('more user info', function(str) {
    cli.responders.moreUserInfo(str)
});

e.on('list checks', function(str) {
    cli.responders.listChecks(str)
});

e.on('more check info', function(str) {
    cli.responders.moreCheckInfo(str)
});

e.on('list logs', function(str) {
    cli.responders.listLogs()
});

e.on('more log info', function(str) {
    cli.responders.moreLogInfo(str)
});

// responders object
cli.responders = {};

// help/man
cli.responders.help = function() {
    console.log('You asked for help');
}

// exit
cli.responders.stats = function() {
    console.log('You asked to show stats');
}

// help/man
cli.responders.listUsers = function() {
    console.log('You asked to list all users');
}

// help/man
cli.responders.moreUserInfo = function(str) {
    console.log(`You asked for more user info ${str}`);
};

// help/man
cli.responders.listChecks = function() {
    console.log('You asked to list all checks');
}

// help/man
cli.responders.moreCheckInfo = function(str) {
    console.log(`You asked for more check info ${str}`);
};

// help/man
cli.responders.listLogs = function() {
    console.log('You asked to list all logs');
};

// help/man
cli.responders.moreLogInfo = function(str) {
    console.log(`You asked for more log info ${str}`);
};

cli.processInput = function(str) {
    // sanitize the string
    str = helpers.isTypeOfValid(str, "string") && helpers.trimString(str) ? str : '';
    
    // only process the input if the user writes something
    if (str) {
        // codify the unique string that identify the unique questions allowed to be a
        const uniqueInput = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info'
        ];

        // go through the possible input and emit an event when a match is found
        let matchFound = false;
        let counter = 0;

        uniqueInput.some(function(input) {
            if (str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                
                // emit an event matching the unique input and include the full string given by the user
                e.emit(input, str) //
                return true;
            }
        });

        // if no match is found, tell the user to try again
        if (!matchFound) {
            console.log(`'${str}' is not a recognized command. Try again`);
        }
    }
}

cli.init = function() {
    // send the start message to the console with a dark blue colour
    console.log('\x1b[34m%s\x1b[0m', "The CLI is listening");

    // start the interface
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    })

    // manually create an initial prompt
    _interface.prompt();

    // handle each line of input separately
    _interface.on('line', function(str) {
        // do something with the string
        // send to the input processor
        cli.processInput(str);

        // reinitialize the prompt afterwards
        _interface.prompt();
    })

    // if the user stops the CLI, kill the associated process
    _interface.on('close', function() {
        process.exit(0)
    });
}



module.exports = cli;