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
app.client.request = function({ headers, path, method, queryStringObj, payload, callback }) {    
    headers = app.isTypeOfValid(headers, "object") && headers !== null ? headers : {};
    path = app.isTypeOfValid(path, "string") ? path : '';
    method = app.isTypeOfValid(method, "string") && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) > -1 ? method : '';
    queryStringObj = app.isTypeOfValid(queryStringObj, "object") && queryStringObj !== null ? queryStringObj : {};
    payload = app.isTypeOfValid(payload, "object") && payload !== null ? payload : {};
    callback = app.isTypeOfValid(payload, "function") ? callback : false;

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

    // for eachh header sent, add it to the request
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
    console.log({ form });

    form.addEventListener("submit", function(e){
  
      // Stop it from submitting
      e.preventDefault();
      var formId = this.id;
      var path = this.action;
      var method = this.method.toUpperCase();
  
      // Hide the error message (if it's currently shown due to a previous error)
      document.querySelector("#"+formId+" .formError").style.display = 'hidden';
  
      // Turn the inputs into a payload
      var payload = {};
      var elements = this.elements;
      for(var i = 0; i < elements.length; i++){
        if(elements[i].type !== 'submit'){
          var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
          payload[elements[i].name] = valueOfElement;
        }
      }
  
      // Call the API
      app.client.request(undefined,path,method,undefined,payload,function(statusCode,responsePayload){
        // Display an error on the form if needed
        if(statusCode !== 200){
  
          // Try to get the error from the api, or set a default error message
          var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';
  
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
  };

  // Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
    var functionToCall = false;
    if(formId == 'accountCreate'){
        console.log('The account create form was successfully submitted');
      // @TODO Do something here now that the account has been created successfully
    }
};
  
// Init (bootstrapping)
app.init = function(){
    // Bind all form submissions
    app.bindForms();
};

// Call the init processes after the window loads
window.onload = function(){
    app.init();
};
  