var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    date:{type:Date,default:Date.now()},
    developers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}],
    status:{type:Number,default:0},//0 open, 1 investigation 2 delivery 3 closed
    priority:{type:Number,default:1},
    title:{type:String,default:""},
    comment:{type:String,default:""},
    type:{type:Number,default:0},// 0 bugfix 1 routine task
    parent: {type:mongoose.Schema.ObjectId,ref:'developerTask',default:null},
    level:{type:Number,default:0}, // 0 没有parent:
});