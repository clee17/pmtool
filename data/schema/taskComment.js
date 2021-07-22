var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,ref:'user',default:null},
    task: {type:mongoose.Schema.ObjectId,ref:'tasks',default:null},
    parent:{type:mongoose.Schema.ObjectId,ref:'taskComment',default:null},
    type:{type:Number,default:0}, // 0, description; 1, comment, 2, close/open task; 3,
    status:{type:Number,default:0}, //0 opened; 1 Analyzing; 2, engineer assigned; 3, QA Verifying
    date:{type:Date,default:Date.now()},
    comment:{type:String,default:""},
    attachments:[{type:mongoose.Schema.ObjectId,ref:'attach',default:null}],
});