var mongoose = require('mongoose');

var connect = mongoose.createConnection('mongodb://127.0.0.1:27017/Projects',{useNewUrlParser: true});

connect.then(
    ()=>{
        console.log('database successfully connected');
    },
    err=>{
        console.log("failed to connect to database");
    }
);

module.exports = connect;