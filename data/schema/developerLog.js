var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user: {type:mongoose.Schema.ObjectId,ref:'user',default:null},
    date:{type:Date,default:Date.now()},
    project:{type:mongoose.Schema.ObjectId,ref:'project',default:null},
    task:{type:mongoose.Schema.ObjectId,ref:'projectTask',default:null},
    contents:{type:String,default:""},
    efforts:{type:Number,default:0}, // 以hour为单位；
    type:{type:Number,default:0}, // not sure what to use, just in case.
});