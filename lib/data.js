/* 
* Library for storing and editind data
file = filename
*/

// Dependencies
const fs = require('fs');
const path = require('path'); // normalize the path to different directories
const helpers = require('../utils/helper');


// create a container for the module (to be exported)
const lib = {};

// define base directory of the data folder; resolves it to one single nice path
lib.baseDir = path.join(__dirname, '/../.data/');

// create a function to write data to the file
lib.create = function(dir, file, data, callback) {
    // open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // convert data to string before writing
            const stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if (!err) {
                    fs.close(fileDescriptor, function(err) {
                        if (!err) {
                           callback(false)
                        } else {
                            callback('Error closing new file')
                        } 
                    })
                } else {
                    callback('Error writing to new file')
                }
            })
        } else {
            // callback error
            console.log({ err });
            callback('Could not create new file. Check that file does not exist')
        }
    })
}

lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', function(err,data){
        if(!err && data){
            // let's call back the parsed data vs the raw one
          const parsedData = helpers.parseJSONToObject(data);
          callback(false,parsedData);
        } else {
          callback(err,data);
        }
    });
}

lib.update = function(dir, file, data, callback) {
    // open the file for writing
    // r+ helps to error out if the file doesn't exist
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // convert data to string value
            const stringData = JSON.stringify(data);

            // Truncate the file contents before writing to it
            fs.truncate(fileDescriptor, function(err) {
                if (!err) {
                    // write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if (!err) {
                            fs.close(fileDescriptor, function(err) {
                               if (!err) {
                                    callback(false)
                               } else {
                                callback("Error closing the file")
                               }
                            })
                        } else {
                            callback('Error writing to existing file')
                        }
                    })
                } else {
                    callback('Error truncating file')
                }
            })

        } else {
            callback("could not open the file. Check that file exists")
        }
    })
}

lib.delete = function(dir, file, callback) {
    // unlink the file (remove the file from the file system)
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err) {
        if (!err) {
            callback(false)
        } else {
            callback('Unable to delete file')
        }
    })
}

module.exports = lib;