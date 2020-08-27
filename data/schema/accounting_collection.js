var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    description:{type:String,default:""},
    date:{type:Date,default:Date.now()},
    amount:{type:Number,default:0},
    currency:{type:Number,default:0}, //0 $, 1 ¥, 2
    invoice: {type:mongoose.Schema.ObjectId,ref:'doc',default:null}
});