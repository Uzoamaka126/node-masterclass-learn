# Uptime URL checker 


### A [bare-bones] demo client and server side application that makes use of in-built functionalities in NodeJs without any third party packages. 

### The in-built 'http' is used to query a local server and also used to serve HTML, CSS and JS files while files and output are store locally in memory. Additionally, there are background and CLI services available to run background workers and log files respectively.

### To run the server locally, run the following command below:
``` node index.js```

### Below is a list of available CLI commands to run when the server is running locally

```
    'exit': 'Kill the CLI',
    'man': "Show this help page",
    'help': "Alias of the 'man' command",
    'stats': "Get statistics on the undderlying operationg system and resource utilization",
    'list users': "Show a list of all the registered (undeleted) users in the system",
    'more user info --{userId}': "Show details of a specific user",
    'list checks --up --down': "Show a list of all the active checks in the system, including their state. The '--up' and '--down' flags are both optional",
    'more check info --{checkId}': "Show details of a specified check",
    'list logs': "Show a list of all the log files available to be read (compressed only)",
    'more log info --{fileName}': "Show details of a specified log file",
```