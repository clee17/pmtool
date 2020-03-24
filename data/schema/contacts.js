var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title: {type:String,default:""},
    department: {type:mongoose.Schema.ObjectId,ref:'department',default:null},
    name : {type:String,default:""},
    nameCN:{type:String,default:""},
    number:{type:Number,default:-1},
    email:{type:String,default:""},
    location:{type:mongoose.Schema.ObjectId,ref:'location',default:null}
});