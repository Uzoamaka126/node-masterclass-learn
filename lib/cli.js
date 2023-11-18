// For all CLI related tasks

// Define dependencies
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
const os = require('os');
const v8 = require('v8');
const _data = require('./data');
const _logs= require('./logs');
const helpers = require('../utils/helper');
class _events extends events{};
const e = new _events;

// instantiate the CLI module object
const cli = {};

// input handlers
cli.handleEvents = function(eventName, str) {
    if (!eventName) return;

    let eventFunction;
    
    if (eventName === 'man') {
        eventFunction = cli.responders.help()
    }

    const transformedEventName = helpers.toCamelCaseWithSpace(eventName);

    if (transformedEventName !== 'man' && cli.responders[transformedEventName]) {
        eventFunction = cli.responders[transformedEventName];
    }
    
    e.on(eventName, () => eventFunction(str))
};

// responders object
cli.responders = {};

// horizontal across the screen
cli.horizontalLine = function() {
    // get the available screen size
    const width = process.stdout.columns;
    let line = '';

    for (let i = 0; i < width; i++) {
        line+='-'
    }
    console.log(line);
};

// created centered text on the screen
cli.centered = function(str) {
    // get the available width
    str = helpers.isTypeOfValid(str, "string") && str.trim().length > 0 ? str.trim() : '';

    const width = process.stdout.columns;

    // calculate the left padding
    const leftPadding = Math.floor((width - str.length) / 2);

    // put in left padded spaces before the string itself
    let line = '';
    for (let i = 0; i < leftPadding; i++) {
        line+=' ';
    }

    line+=str;
    console.log(line);
};

// lines for the each command
cli.verticalSpace = function(lines) {
    helpers.isTypeOfValid(lines, "number") && lines > 0 ? lines : 1;
    for (let i = 0; i < lines; i++) {
        console.log('');
    }
}

// responder events

// exit
cli.responders.exit = function() {
    process.exit(0)
}

// help/man
cli.responders.help = function() {
    const commands = {
        'exit': 'Kill the CLI',
        'man': "Show this help page",
        'help': "Alias of the 'man' command",
        'stats': "Get statistics on the undderlying operationg system and resource utilization",
        'list users': "Show a list of all the registered (undeleted) users in the system",
        'more user info --{userId}': "Show details of a specific user",
        'list checks --up --down': "Show a list of all the active checks in the system, including their state. The '--up' and '--down' flags are both optional",
        'more check info --{checkId}': "Show details of a specified check",
        'list logs': "Show a list of all the log files available to be read (compressed only)",
        'more log info --{fileName}': "Show details of a specified log file",
    };

    // show a header for the help page that is as wide as the screen
    cli.horizontalLine();
    cli.centered('CLI MANUAL');
    cli.horizontalLine();
    cli.verticalSpace(2);

    // show each command in yellow, followed by its explanation in white
    for (var key in commands) {
        if (commands.hasOwnProperty(key)) {
            const value = commands[key];
            let line = '\x1b[33m'+key+'\x1b[0m';
            const padding = 60 - line.length;

            for (let i = 0; i < padding; i++) {
                line+=' ';
            }

            line+=value;

            console.log(line);
            cli.verticalSpace();
        }
    }

    cli.verticalSpace(1);

    // end another horizontal line
    cli.horizontalLine();
};

// stats
cli.responders.stats = function(str) {
    // compile an object of stats
   const stats = {
    'Load Average': os.loadavg().join(' '),
    'CPU Count': os.cpus().length,
    'Free Memory': os.freemem,
    'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
    'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
    'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size /v8.getHeapStatistics().total_heap_size) * 100),
    'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size /v8.getHeapStatistics().heap_size_limit) * 100),
    'Uptime': os.uptime()+' Seconds',
   };

    // Create a header for the stats
    cli.horizontalLine();
    cli.centered('SYSTEM STATISTICS');
    cli.horizontalLine();
    cli.verticalSpace(2);

    // show each command in yellow, followed by its explanation in white
    for (var key in stats) {
        if (stats.hasOwnProperty(key)) {
            const value = stats[key];
            let line = '\x1b[33m'+key+'\x1b[0m';
            const padding = 60 - line.length;

            for (let i = 0; i < padding; i++) {
                line+=' ';
            }

            line+=value;
            
            console.log(line);
            cli.verticalSpace();
        }
    }

    cli.verticalSpace(1);

    // end another horizontal line
    cli.horizontalLine();
}

// list all users
cli.responders.listUsers = function() {
   _data.list("users", function(err, userIds) {
        if (!err && userIds) {
            cli.verticalSpace();
        
            userIds.forEach(function(id) {
                _data.read('users', id, function(err, userData) {
                    if (!err && userData) {
                        let line = `Name: ${userData.firstName} ${userData.lastName} Phone: ${userData.phone} Checks: `;
                        const checks = helpers.isTypeOfValid(userData.checks, 'object') && helpers.isInstanceOfArray(userData.checks) && userData.checks.length ? userData.checks.length : 0;

                        line+=checks;
                        
                        console.log(line);
                        cli.verticalSpace();
                    } else {

                    }
                })
            })
        }
    })
}

// get more user info
cli.responders.moreUserInfo = function(str) {
    if (str) {
        const splitArr = str.split("--");
        const userId = helpers.isTypeOfValid(splitArr[1], 'string') && splitArr[1].trim().length > 0 ? splitArr[1].trim() : false;

        if (userId) {
            _data.read('users', userId, function(err, userData) {
                if (!err && userData) {
                    let line = `Name: ${userData.firstName} ${userData.lastName} Phone: ${userData.phone} Checks: `;
                    const checks = helpers.isTypeOfValid(userData.checks, 'object') && helpers.isInstanceOfArray(userData.checks) && userData.checks.length ? userData.checks.length : 0;
        
                    line+=checks;
                    
                    console.log(line);
                    cli.verticalSpace();
                } else {
                    console.log(`User with id ${userId} not found`);
                }
            })
        } else {
            console.log('User id flag required');
        }
    }
};

// list all checks
cli.responders.listChecks = function(str) {
    _data.list("checks", function(err, checkIds) {
        if (!err && checkIds && checkIds.length > 0) {
            cli.verticalSpace();

            checkIds.forEach(function(id) {
                _data.read('checks', id, function(err, checkData) {
                    if (!err && checkData) {
                        const lowerString = str.toLowerCase();
             
                         // get the state, default to down
                         const state = helpers.isTypeOfValid(checkData.state, "string") ? checkData.state : 'down';

                        //  get the state, default to unknown
                        const stateOrUnknown = helpers.isTypeOfValid(checkData.state, "string") ? checkData.state : 'unknown';

                        // if the user has specified the state, or hasn't specified any state, include the current state
                        if (
                            (lowerString.indexOf('--'+state) > -1) || 
                            (lowerString.indexOf('--down') === -1 && lowerString.indexOf('--up') === -1)
                        ) {
                            const line = `ID: ${checkData.id} | ${checkData.method.toUpperCase()} | ${checkData.protocol}://${checkData.url} | State: ${stateOrUnknown}`;
                            console.log(line);
                            cli.verticalSpace();
                        }
                    } else {
                        console.log(`Check with id ${id} not found`);
                    }
                })
            })
        }
    })
}

// request for more check info
cli.responders.moreCheckInfo = function(str) {
    if (str) {
        // get the check id from the CLI command
        const splitArr = str.split("--");
        const checkId = helpers.isTypeOfValid(splitArr[1], 'string') && splitArr[1].trim().length > 0 ? splitArr[1].trim() : false;

        if (checkId) {
            _data.read("checks", checkId, function(err, checkData) {
                if (!err && checkData) {
                    const line = `Check ID: ${checkData.id} | Method: ${checkData.method.toUpperCase()} | URL: ${checkData.protocol}://${checkData.url} | State: ${checkData.state}`;
        
                    console.log(line);
                    cli.verticalSpace();
                } else {
                    console.log(`Check with id ${checkId} not found`);
                }
            })
        } else {
            console.log('Pass the check id as a flag to get more information on a check');
        }
    }
};

// list all logs
cli.responders.listLogs = function() {
    _logs.list(true, function(err, logFileNames) {
        if (!err && logFileNames && logFileNames.length) {
            cli.verticalSpace();
            logFileNames.forEach(function(log) {
                // get rid of the logs that haven't been compressed
                // compressed log files have a '-' in their names
                if (log.indexOf('-') > -1) {
                    console.log(log);
                    cli.verticalSpace()
                }
            });
        }
    })
};

// request for more log info
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

        uniqueInput.some(function(input) {
            if (str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                
                // emit an event matching the unique input and include the full string given by the user
                cli.handleEvents(input, str);

                e.emit(input, str)

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