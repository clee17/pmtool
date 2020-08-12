var express = require('express'),
    config = require('./configure'),
    route = require('./route');

var app = express();

app = config(app);
route(app);

app.listen(4040);

