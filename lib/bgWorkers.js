/*
* Primary file for the workers-related tasks
*
*/

// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
// the workers are going to use either http or https depending on the nature of the checks
const https = require('https')
const http = require('http')
const helpers = require('../utils/helper');
const url = require('url');

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
    data.url = helpers.isTypeOfValid(data.url, 'string') && data.url.trim().length === 0 ? data.url : false;
    data.method = helpers.isTypeOfValid(data.method, 'string') && ['post', 'get', 'delete', 'put'].indexOf(data.method) > -1 ? data.method : false;
    data.successCodes = helpers.isTypeOfValid(data.successCodes, 'object') && helpers.isInstanceOfArray(data.successCodes) && data.successCodes.length > 0 ? data.successCodes : [];
    data.timeoutSecs = helpers.isTypeOfValid(data.successCodes, 'number') && (data.payload.timeoutSecs % 1 === 0) && (data.payload.timeoutSecs >= 1 && data.payload.timeoutSecs <= 5) 
    ? data.timeoutSecs : false;

    // set the keys that may not be set (if the workers have never been seen)
    // data.state = 

}

// timer to execute the worker process once per minute
workers.loop = function() {
    setInterval(function() {
        workers.gatherAllChecks()
    }, 1000 * 60)
}

workers.init = function() {
    // execute all the checks immediately
    workers.gatherAllChecks()

    // call the loop so the checks continue to execute on their own. We are going to use a set interval to determine the execution
    workers.loop()
}

// export the module
module.exports = workers;