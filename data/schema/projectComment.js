var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,ref:'user',default:null},
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    status:{type:Number,default:0},
    date:{type:Date,default:Date.now()},
    schedule:{type:Date,default:Date.now()},
    comment:{type:String,default:""},
    attachments:[{type:mongoose.Schema.ObjectId,ref:'attach',default:null}],
});