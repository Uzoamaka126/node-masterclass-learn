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

lib.list = function(includeCompressedLogs, callback) {
    fs.readdir(lib.baseDir, function(err, data) {
        if (!err && data && data.length) {
            const trimmedFileNames = []; // without the .log in them
            data.forEach (function(fileName) {
                // add the .log files
                if (fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log', ''))
                }

                // add the decompressed files with the extension .gz
                // we're doing a base-64 encoding to be able to unzip them later
                if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''))
                }
            });
            callback(false, trimmedFileNames)
        } else {
            callback(err, data)
        }
    })
};

// compress the contents of a single .log file into a .gz.b64 file within the same directory using gzip
lib.compress = function(id, updatedId, callback) {
    const srcFile = id+'.log';
    const destinationFile = updatedId+'.gz.b64';

    // read the source file
    fs.readFile(lib.baseDir+srcFile, 'utf-8', function(err, strContents) {
        if (!err && strContents) {
            // compress the data string using .gzip
            zLib.gzip(strContents, function(err, buffer) {
                if (!err && buffer) {
                    // send the data to the destination file
                    fs.open(lib.baseDir+destinationFile, 'wx', function(err, fileDescriptor) {
                        if (!err && fileDescriptor) {
                            // write to the destination file
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err) {
                                if (!err) {
                                    // close the destination file
                                    fs.close(fileDescriptor, function(err) {
                                        if (!err) {
                                            callback(false)
                                        } else {
                                            callback(err)
                                        }
                                    });
                                } else {
                                    callback(err)
                                }
                            })
                        } else {
                            callback(err)
                        }
                    })
                } else {
                    callback(err)
                }
            })
        } else {
            callback(err)
        }
    })
};

// decompress the contents of a .gz.b64 compressed file into a string variable
lib.decompress = function(fileId, callback) {
    const fileName = fileId+'.gz.b64';
    fs.readFile(lib.baseDir+fileName, 'utf-8', function(err, strData) {
        if (!err && strData) {
            // create a buffer out of the base64 string; (basically a reverse of the compress function)
            // decompress the data
            const bufferInput = Buffer.from(strData, 'base64');
            zLib.unzip(bufferInput, function(err, bufferOutput) {
                if (!err && bufferOutput) {
                    const str = bufferOutput.toString();
                    callback(false, str)
                } else {
                    callback(err)
                }
            })
        } else {
            callback(err)
        }
    })
};

lib.truncate = function(id, callback) {
    fs.truncate(lib.baseDir+id+'.log', function(err) {
        if (!err) {
            callback(false)
        } else {
            callback(err)
        }
    })
};

module.exports = lib;