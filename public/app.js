// Frontend logic for the app
const app = {};

app.config = {
    'sessionToken': false
};

app.isTypeOfValid = function(value, type) {
    if (typeof (value) === type) {
        return true
    } else {
        return false
    }
}

// AJAX client for the RESTful API
app.client = {};

// interface for making API calls
/**  
 * Options params:
    * headers, path, method, queryStringObj, payload, callback
*/
app.client.request = function(headers, path, method, queryStringObj, payload, callback) {    
    console.log({ headers, path, method, queryStringObj, payload });
    headers = app.isTypeOfValid(headers, "object") && headers !== null ? headers : {};
    path = path && app.isTypeOfValid(path, "string") ? path : '';
    method = method && app.isTypeOfValid(method, "string") && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) > -1 ? method : '';
    queryStringObj = queryStringObj && app.isTypeOfValid(queryStringObj, "object") && queryStringObj !== null ? queryStringObj : {};
    payload = app.isTypeOfValid(payload, "object") && payload !== null ? payload : {};
    callback = app.isTypeOfValid(callback, "function") ? callback : false;

    // for each query string parameter sent, add it to the path
    const requestUrl = `${path}?`;
    let counter = 0;

    for (var queryKey in queryStringObj) {
        if (queryStringObj.hasOwnProperty(queryKey)) {
            counter++;
            // if at least one query string parameter has already been added, prepend new ones
            if (counter > 1) {
                requestUrl+='&';
            }
            // add key value
            requestUrl+=`${queryKey}=${queryStringObj[queryKey]}`;
        }
    }
    // form the HTTP request as a JSON type
    const xhr = new XMLHttpRequest();
    
    // open the request
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    // for each header sent, add it to the request object/payload
    for (var headerKey in headers) {
        if (headers.hasOwnProperty(headerKey)) {
           xhr.setRequestHeader(headerKey, headers[headerKey])
        }
    }

    // if there is a session token, add it to the headers
    if (app.config.sessionToken) {
        xhr.setRequestHeader('token', app.config.sessionToken.id);
    }

    // when the request comes back, handle the response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            const statusCode = xhr.status;
            const response = xhr.responseText;

            console.log({ statusCode, response, callback });

            // callback if requested
            if (callback) {
                try {
                    // parse the JSON response
                    const parsedResponse = JSON.parse(response);
                    callback(statusCode, parsedResponse)
                } catch (error) {
                    // catch error if JSON response fails to parse
                    callback(statusCode, false);
                }
            }
        }
    }

    // send payload as JSON
    const payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
}

app.bindForms = function(){
    const form = document.querySelector("form");
    
    if (form) {
        form.addEventListener("submit", function(e){
      
          // Stop it from submitting
            e.preventDefault();
            const formId = this.id;
            const path = this.action;
            const method = this.method.toUpperCase();
        
            // Hide the error message (if it's currently shown due to a previous error)
            document.querySelector("#"+formId+" .formError").style.display = 'hidden';
        
            // Turn the inputs into a payload
            const payload = {};
            const elements = this.elements;
            
            for (let i = 0; i < elements.length; i++){
                if (elements[i].type !== 'submit'){
                    const valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                    payload[elements[i].name] = valueOfElement;
                }
            }
        
            // Call the API
            app.client.request(undefined, path, method, undefined, payload, function(statusCode, responsePayload){
                console.log({ statusCode, responsePayload });
                // Display an error on the form if needed
                if (statusCode !== 200){
        
                    // Try to get the error from the api, or set a default error message
                    const error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';
            
                    // Set the formError field with the error text
                    document.querySelector("#"+formId+" .formError").innerHTML = error;
            
                    // Show (unhide) the form error field on the form
                    document.querySelector("#"+formId+" .formError").style.display = 'block';
            
                } else {
                    // If successful, send to form response processor
                    app.formResponseProcessor(formId,payload,responsePayload);
                }
            });
        });
    }
  };

  // Form response processor
app.formResponseProcessor = function(formId, requestPayload, responsePayload){
    if (formId === 'accountCreate'){
        // @TODO Do something here now that the account has been created successfully
        const payload = {
            "phone": requestPayload.phone,
            "password": requestPayload.password
        };

        app.client.request(undefined, 'api/tokens', 'POST', undefined, payload, function(statusCode, newResponsePayload) {
            // Display an error on the form if needed
            if (statusCode !== 200){
    
                // Set the formError field with the error text
                document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';
        
                // Show (unhide) the form error field on the form
                document.querySelector("#"+formId+" .formError").style.display = 'block';
        
            } else {
                // If successful, set the token and redirect the user
                app.setSessionToken(newResponsePayload);
                window.location = '/checks/all';
            }
        });
    }

    console.log({ responsePayload, formId });

    // If login was successful, set the token in localstorage and redirect the user
    if(formId === 'sessionCreate'){
        app.setSessionToken(responsePayload);
        window.location = '/checks/all';
    }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function(){
    const tokenString = localStorage.getItem('token');
    
    if (typeof(tokenString) === 'string'){
        try{
            const token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            
            if (typeof(token) === 'object'){
                app.setLoggedInClass(true);
            } else {
                app.setLoggedInClass(false);
            }

        } catch(e){
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        }
    }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
    const target = document.querySelector("body");
    
    if (add){
        target.classList.add('loggedIn');
    } else {
        target.classList.remove('loggedIn');
    }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token){
    app.config.sessionToken = token;
    
    const tokenString = JSON.stringify(token);
    localStorage.setItem('token',tokenString);

    if (typeof(token) === 'object'){
        app.setLoggedInClass(true);
    } else {
        app.setLoggedInClass(false);
    }
};

// Renew the token
app.renewToken = function (callback){
    const currentToken = typeof(app.config.sessionToken) === 'object' ? app.config.sessionToken : false;
    
    if (currentToken){
      // Update the token with a new expiration
      const payload = {
        'id' : currentToken.id,
        'extend' : true,
      };
      
        app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload, function(statusCode,responsePayload){
            // Display an error on the form if needed
            if (statusCode === 200){
                // Get the new token details
                const queryStringObject = {'id' : currentToken.id};

                app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined, function(statusCode,responsePayload){
                    // Display an error on the form if needed
                    if(statusCode === 200){
                        app.setSessionToken(responsePayload);
                        callback(false);
                    } else {
                        app.setSessionToken(false);
                        callback(true);
                    }
                });
            } else {
                app.setSessionToken(false);
                callback(true);
            }
        });
    } else {
        app.setSessionToken(false);
        callback(true);
    }
};
  
  // Loop to renew token often
app.tokenRenewalLoop = function(){
    setInterval(function(){
        app.renewToken(function(err){
        
            if(!err){
                console.log("Token renewed successfully @ "+Date.now());
            }
        });
    },1000 * 60);
};

// Init (bootstrapping)
app.init = function(){
    // Bind all form submissions
    app.bindForms();

    // Get the token from localstorage
    app.getSessionToken();

    // Renew token
    app.tokenRenewalLoop();
};

// Call the init processes after the window loads
window.onload = function(){
    app.init();
};
  