var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    contents:{type:String,default:""},
    time:{type:Date,default:Date.now()}
});