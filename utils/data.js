export const templateData = {
    "index": {
        'head.title': 'Head Title',
        'head.description': 'Head Description',
        'body.title': 'And we are live!',
        'body.class': 'index',
    },
}

export const routesProps = {
    "/": {
        methods: ["get"],
        key: "index"
    },
    'ping':{
        methods: ["get"],
        key: "ping"
    },
    '404': {
        methods: ["get"],
        key: "not_found"
    },
    'api/users': {
        methods:  ['post', 'get', 'put', 'delete'],
        key: "users"
    },
    'api/tokens': {
        methods:  ['post', 'get', 'put', 'delete'],
        key: "tokens"
    },
    'api/checks': {
        methods:  ['post', 'get', 'put', 'delete'],
        key: "checks"
    },
    'api/account': {
        methods:  ['post', 'get', 'put', 'delete'],
        key: "account"
    },
    'api/session': {
        methods:  ['post', 'get', 'put', 'delete'],
        key: "session"
    },
    'favicon.ico':{
        methods: ["get"],
        key: "favicon"
    },
    'public': {
        methods: ["get"],
        key: "public"
    },
    'api/errorhandler': {
        methods: ["get"],
        key: "error_handler"
    },
}