var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    name:{type:String,default:""},
    description:{type:String,default:""},
    date:{type:Date,default:Date.now()},
    source:{type:Number,default:0},
    type:{type:Number,default:0}, // 0 NDA, 1 SOW, 2 contract, 3, royalty 2 invoice 3 material
    link:{type:String,default:""},
    reference:{type:String,default:""}
});