var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    priority:{type:Number,default:1},
    developer: {type:mongoose.Schema.ObjectId,ref:'user',default:null},
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
});