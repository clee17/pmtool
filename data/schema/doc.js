var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    name:{type:String,default:""},
    description:{type:String,default:""},
    date:{type:Date,default:Date.now()},
    modified:{type:Date,default:Date.now()},
    source:{type:Number,default:0}, //
    type:{type:Number,default:0}, // 0 NDA, 1 SOW, 2 contract, 3, royalty 4 invoice 5 project reference 6 入账凭证,
    link:{type:String,default:""},
    reference:{type:String,default:""},
    parent:{type:mongoose.Schema.ObjectId,ref:'doc',default:null},
    position:{type:mongoose.Schema.ObjectId,ref:'position',default:null},
    history:[{uploaded:{type:Date,default:Date.now()},link:{type:String,default:0}}]
});