/* 
    Test runner
*/

// Dependencies
const helpers = require('../utils/helper');
const assert = require('assert');

// app logic for the test runner
const _app = {};

_app.tests = {
    'unit': {},
}

// test that the get number helpers function returns a number
// done is a conventional callback many test runners use
_app.tests.unit['helpers.getANumber should return a number'] = function(done) {
    const value = helpers.getANumber();

    assert.equal(typeof(value), "number");
    done();
}

// test that the get number helpers function returns 1
_app.tests.unit['helpers.getANumber should return 1'] = function(done) {
    const value = helpers.getANumber();

    assert.equal(value, 1);
    done();
}

// test that the get number helpers function does not return 2 or any number that isn't 1
_app.tests.unit['helpers.getANumber should not return any number that isnt 1'] = function(done) {
    const value = helpers.getANumber();

    assert.notEqual(value, 2);
    done();
}

_app.countTests = function() {
    let counter = 0;

    for (var key in _app.tests) {
        if (_app.tests.hasOwnProperty(key)) {
            const subTests = _app.tests[key];
    
            for (var testName in subTests) {
                if (subTests.hasOwnProperty(testName)) {
                    counter++
                }
            }
        }
    }
    return counter;
}

_app.produceTestReports = function(limit, successNum, errors) {
    console.log("");
    console.log("---------BEGIN TEST REPORT------------");
    console.log("");
    console.log("Total Tests", limit);
    console.log("Passed:", successNum);
    console.log("Failed:", errors.length);
    console.log("");

    // if errors, log them in detail
    if (errors.length) {
        console.log("---------BEGIN ERROR LOGS------------");
        console.log("");

        errors.forEach(function(err) {
            console.log('\x1b[33m%s\x1b[0m', err.name);
            console.log(err.error);
            console.log("");
        });

        console.log("");
        console.log("---------END ERROR LOGS------------");
    }
    console.log("---------END TEST REPORT------------");
}

_app.runTests = function() {
    let errors = [];
    let numOfSuccessfulTests = 0;
    let limit = _app.countTests();
    let counter = 0;

    for (var key in _app.tests) {
        if (_app.tests.hasOwnProperty(key)) {
            const subTests = _app.tests[key];

            for (var testName in subTests) {
                if (subTests.hasOwnProperty(testName)) {
                    // use a self-executing function to encapsulate all of the defined tests variable
                    (function() {
                        const temp = testName;
                        const testValue = subTests[testName];

                        try {
                            testValue(function() {
                                // if the callback executes without throwing, then the test is a success and we can log it as green
                                console.log('\x1b[32m%s\x1b[0m', temp);
                                counter++;
                                numOfSuccessfulTests++;

                                if (counter === limit) {
                                    _app.produceTestReports(limit, numOfSuccessfulTests, errors);
                                }
                            })
                        } catch (error) {
                            console.log({ error });
                            errors.push({
                                'name': testName,
                                'error': error
                            });
                            console.log('\x1b[33m%s\x1b[0m', temp);
                            counter++;

                            if (counter === limit) {
                                _app.produceTestReports(limit, numOfSuccessfulTests, errors)
                            }
                        }
                    })();
                }
            }
        }
    }
}

// run all tests
_app.runTests();