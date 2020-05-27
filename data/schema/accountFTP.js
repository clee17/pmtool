var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    username:{type:String,default:""},
    password:{type:String,default:""},
});