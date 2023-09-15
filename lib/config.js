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
    'hashingSecret': 'sweet'
}

// prod environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'name': 'production',
    'hashingSecret': 'awesome'
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