var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user: {type:mongoose.Schema.ObjectId,ref:'user',default:null},
    date:{type:Date,default:Date.now()},
    task:{type:mongoose.Schema.ObjectId,ref:'developerTask',default:null},
    contents:{type:String,default:""},
    efforts:{type:Number,default:0}, // 以hour为单位；
    type:{type:Number,default:0}, // not sure what to use, just in case.
});