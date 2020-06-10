var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,ref:'user',default:null},
    pwd:{type:String,default:""}
});