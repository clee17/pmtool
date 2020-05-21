var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    comment: {type:String,default:""},
    PO:{type:String,default:""},
    date:{type:Date,default:Date.now()},
    status:{type:Number,default:0}, //0, invoice requested, 1, invoice issued , 2 payment completed
    amount:{type:Number,default:0},
    currency:{type:Number,default:0},//0 $, 1 ¥, 2, ￥;
    type:{type:Number,default:0},// 0, normal, 1, follow up required.
});