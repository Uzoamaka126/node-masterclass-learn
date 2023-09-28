/* 
Create and export configuration variables
*/
// Hold all the env variables in this variable
const environments = {};

// dev (default) environment
environments.development = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'name': 'development',
    'hashingSecret': 'sweet',
    'maxChecks': 5,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
    }
}

// prod environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'name': 'production',
    'hashingSecret': 'awesome',
    'maxChecks': 10,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
    }
}

// Determine the current env to export
const currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';
let currentEnvValue;

// check that the current env can be found on the environments object
if (typeof(environments[currentEnv]) === 'object') {
    currentEnvValue = environments[currentEnv]
} else {
    currentEnvValue = environments.development
}

module.exports = currentEnvValue