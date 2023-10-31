/*
* Primary file for the workers-related tasks
*
*/

// Dependencies
// const path = require('path');
// const fs = require('fs');
const _data = require('./data');
// the workers are going to use either http or https depending on the nature of the checks
const https = require('https')
const http = require('http')
const helpers = require('../utils/helper');
const url = require('url');
const _logs = require('./logs');

// instantiate the workers
const workers = {};

// lookup all checks, get their data and send them to a validator
workers.gatherAllChecks = function() {
    // get all checks
    _data.list('checks', function(err, checks) {
        if (!err && checks && checks.length > 0) {
            checks.forEach(function(check) {
                // read in the check data
                _data.read('checks', check, function(err, originalCheckData) {
                    // we are going to read the state the check was in, and then the state afterwards
                    if (!err && originalCheckData) {
                        // pass it to the check validator, and let that function continue or log an error
                        workers.validateCheckdata(originalCheckData)
                    } else {
                        console.log("Error: reading this check data");
                    }
                })
            })
        } else {
            // note that this is a background method and there is no way to callback a response
            console.log("Error: could not find any checks to process")
        }
    })
}

// sanity check for the check data. No callback needed
workers.validateCheckdata = function(data) {    
    data = helpers.isTypeOfValid(data, 'object') && data !== null ? data : {};
    data.id = helpers.isTypeOfValid(data.id, 'string') && data.id.trim().length === 20 ? data.id.trim() : false;
    data.phone = helpers.isTypeOfValid(data.phone, 'string') && data.phone.trim().length === 10 ? data.id.trim() : false;
    data.protocol = helpers.isTypeOfValid(data.protocol, 'string') && ['http', 'https'].indexOf(data.protocol) > -1 ? data.protocol : false;
    data.url = helpers.isTypeOfValid(data.url, 'string') && data.url.trim().length > 0 ? data.url : false;
    data.method = helpers.isTypeOfValid(data.method, 'string') && ['post', 'get', 'delete', 'put'].indexOf(data.method) > -1 ? data.method : false;
    data.successCodes = helpers.isTypeOfValid(data.successCodes, 'object') && helpers.isInstanceOfArray(data.successCodes) && data.successCodes.length > 0 ? data.successCodes : [];
    data.timeoutSecs = helpers.isTypeOfValid(data.timeoutSecs, 'number') && (data.timeoutSecs % 1 === 0) && (data.timeoutSecs >= 1 && data.timeoutSecs <= 5) 
    ? data.timeoutSecs : false;

    // set the keys that may not be set (if the workers have never been seen)
    data.state =  helpers.isTypeOfValid(data.state, 'string') && ['up', 'down'].indexOf(data.state) > -1 ? data.state : 'down';
    data.lastChecked =  helpers.isTypeOfValid(data.lastChecked, 'number') && ['up', 'down'].indexOf(data.state) > -1 ? data.state : 'down';

    if (data?.id && data?.userPhone && data?.protocol && data?.url && data?.method && data?.successCodes && data?.timeoutSecs) {
        workers.performCheck(data)
    } else {
        console.log("Error: one of the checks is not properly formatted. Skipping it")
    } 
}

workers.performCheck = function(data) {
    // prepare the initial check outcome
    const checkOutcome = {
        'error': false,
        'responseCode': false
    }

    let outcomeSent = false;

    // parse the hostname and the path out of the original check site
    const parsedUrl = url.parse(`${data.protocol}://${data.url}`);
    const hostName = parsedUrl.hostname;
    const path = parsedUrl.path;

    // construct the request object
    const requestDetails = {
        'protocol': `${data.protocol}:`,
        'hostname': hostName,
        'method': data.method?.toUpperCase(),
        'path': path,
        'timeout': data.timeoutSecs * 1000 // key is expecting milliseconds and we receive it in seconds
    };

    // instantiate the request object using either the http or https module
    const _moduleToUse = data.protocol === 'http' ? http : https;
    const request = _moduleToUse.request(requestDetails, function(res) {
        // grab the status of the sent request
        const status = res.statusCode;

        // update check outcome and pass the data along
        checkOutcome.responseCode = status;

        // check if the outcome hasn't been sent already
        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        };
    });

    // bind to the error event so it doesn't get thrown
    request.on('error', function(err) {
        // update the checkoutcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': err
        }

        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        }
    });

    request.on('timeout', function(err) {
        // update the checkoutcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        }

        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        }
    })

    // end the request
    request.end()
}

// process the check outcome, update the check data as needed, trigger an alert if needed
// special logic for accomodating a check that has never been tested before
workers.processCheckOutcome = function(data, checkOutcome) {    
    // decide the state of the check if it's considered up or down
    const state = !checkOutcome.error && checkOutcome.responseCode && data.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // decide if an alert is needed
    const isAlertNeeded = data.lastChecked && data.state !== state ? true : false;

    // log the outcome
    const timeOfCheck = Date.now();
    workers.log({ data, checkOutcome, state, isAlertNeeded, timeOfCheck })

    // update the check data
   const newCheckData = data;
   newCheckData.state = state;
   newCheckData.lastChecked = timeOfCheck;

    // save the updates
    _data.update("checks", newCheckData.id, newCheckData, function(err) {
        if (!err) {
            // send the check data to the next phase
            if (isAlertNeeded) {
                workers.alertUserToStatusCharge(newCheckData);
            } else {
                console.log('Check outcome has not changed. No alert needed');
            }
        } else {
            console.log('Error: trying to save updates to a check');
        }
    })
}

workers.log = function(data) {
    const { data: checkData, checkOutcome, state, isAlertNeeded, timeOfCheck } = data;

    // form the log data
    const logData = {
        'check': checkData,
        'outcome': checkOutcome,
        'state': state,
        'alert': isAlertNeeded,
        'time': timeOfCheck
    };

    //stringfy data
    const stringfiedLogData = JSON.stringify(logData);

    // write different logs for different checks

    // determine the name of the log file
    const logFileName = checkData.id;

    // append the log stream to the file
    _logs.append(logFileName, stringfiedLogData, function(err) {
        if (!err) {
            console.log('Logging to file succeeded');
        } else {
            console.log('Error: Logging to file failed');
        }
    })
}

// timer to execute the worker process once per minute
workers.loop = function() {
    setInterval(function() {
        workers.gatherAllChecks()
    }, 1000 * 60)
}

// compress (or rotate) the log files
workers.rotateLogs = function() {
    // list all [non-compressed] log files in the .logs directory
    _logs.list(false, function(err, logs = []) {
        if (!err && logs.length) {
            logs.forEach(function(logFile) {
                // for each log, compress to a different file
                const logId = logFile.replace('.log', ''); // replace the .log extension with an empty string
                const newFileId = logId+'-'+Date.now(); // add timestap to each newly compressed log;
                _logs.compress(logId, newFileId, function(err) {
                    if (!err) {
                        // truncate or empty out the log contents
                        _logs.truncate(logId, function(err) {
                            if (!err) {
                                console.log('Success truncating log file:', logFile);
                            } else {
                                console.log("Error truncating log file");
                            }
                        })
                    } else {
                        console.log("Error compressing one of the log files", { logFile, err });
                    }
                })
            })
        } else {
            console.log("Error: could not find any logs to rotate");
        }
    })
}

// timer to execute the log compression function process once per day
workers.logRotationLoop = function() {
    setInterval(function() {
        workers.rotateLogs()
    }, 1000 *  60 * 60 * 24) // gets called once per day
};

workers.init = function() {
    // send to console, in yellow
    // '\x1b[33m%s\x1b[0m' --. a command that tells Node to print this in yellow
    console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');
    // execute all the checks immediately
    workers.gatherAllChecks()

    // call the loop so the checks continue to execute on their own. We are going to use a set interval to determine the execution
    workers.loop();

    // compress all the logs immediately
    workers.rotateLogs();

    // call the compression loop so that logs will be compressed later on
    workers.logRotationLoop()
}

workers.alertUserToStatusCharge = function(data) {
    // your check for POST https://google.com is up
    const msg = `Alert your check for ${data.method.toUpperCase()} ${data.method.protocol}://${data.url} is currently ${data.state}`;

    helpers.sendTwilioSms(data.userPhone, msg, function(err) {
        if (!err) {
            console.log('Success: user was alerted to a status change in their check via SMS', msg);
        } else {
            console.log("Error: could not send SMS alert who had a state change in their check");
        }
    })
}

// export the module
module.exports = workers;