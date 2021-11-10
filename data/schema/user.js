var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title: {type:String,default:""},
    type:{type:Number,default:0},
    status:{type:Number,default:0},
    department: {type:String,default:""},
    name : {type:String,default:""},
    nameCN:{type:String,default:""},
    number:{type:Number,default:-1},
    mail:{type:String,default:""},
    location:{type:String,default:""}
});