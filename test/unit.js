// Unit tests
const assert = require('assert');
const _logs = require('../lib/logs')
const helpers = require('../utils/helper');

// central object
const unit = {};

unit['helpers.getANumber should return a number'] = function(done) {
    const value = helpers.getANumber();

    assert.equal(typeof(value), "number");
    done();
}

// test that the get number helpers function returns 1
unit['helpers.getANumber should return 1'] = function(done) {
    const value = helpers.getANumber();

    assert.equal(value, 1);
    done();
}

// test that the get number helpers function does not return 2 or any number that isn't 1
unit['helpers.getANumber should not return any number that isnt 1'] = function(done) {
    const value = helpers.getANumber();

    assert.notEqual(value, 2);
    done();
}

// assert that the log.list should callback an array and a false error
unit['log.list should callback an array of log file names and a false error'] = function(done) {
   _logs.list(true, function(err, logFileNames) {
        assert.equal(err, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
        done();
   });
}

// log.truncate should not throw an error if filename does not exist. It should callback an error instead
unit['log.truncate should not throw an error if filename does not exist. It should callback an error instead'] = function(done) {
    assert.doesNotThrow(function() {
       _logs.truncate('sample filename', function(err) {
            // assert.equal(err, false);
            console.log({ err });
            assert.ok(err);
            done();
       })
    }, TypeError)
}

module.exports = unit;