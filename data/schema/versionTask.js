var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    version: {type:mongoose.Schema.ObjectId,ref:'version',default:null},
    task: {type:mongoose.Schema.ObjectId,ref:'projectTask',default:null},
    type:{type:Number,default:0} // 0 暂定，没想好用途
});