/*
import { module } from './handlers/token';
* Primary file for all logs-related tasks; storing and rotating logs
*
*/

// dependencies;
const path = require('path');
const fs = require('fs');
const zLib = require('zlib') // used for compressing and decompressing files

const lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

// function to append a string to a file. Create the file if it does not exist
lib.append = function(file, str, callback) {
    // open the file for appending
    fs.open(lib.baseDir+file+'.log', 'a', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // append to the file and close it
            fs.appendFile(fileDescriptor, str+'\n', function(err) {
                if (!err) {
                    fs.close(fileDescriptor, function(err) {
                        if (!err) {
                            callback(false)
                        } else {
                            callback("Error closing file after appending")
                        }
                    });
                } else {
                    callback("Error appending the file")
                }
            })
        } else {
            callback('Could not open file for appending')
        }
    })
}

lib.list = function(bool, callback) {};

lib.compress = function(id, updatedId, callback) {};

lib.truncate = function(id, callback) {};

module.exports = lib;