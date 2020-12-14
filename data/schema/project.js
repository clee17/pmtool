var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name:{type:String,default:""},
    owner: {type:mongoose.Schema.ObjectId,ref:'user',default:null},
    description:{type:String,default:""},
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    endCustomer: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    priority:{type:Number,default:0},
    date:{type:Date,default:Date.now()},
    schedule:{type:Date,default:Date.now()},
    contacts:[{type:mongoose.Schema.ObjectId,ref:'contacts',default:null}],
    delivery:{type:mongoose.Schema.ObjectId,ref:'delivery',default:null},
    status: {type:Number,default:0}, // 0 opportunities, 1, evaluation, 2, development, 3 delivery 4 maintenance
    suppliers:[{type:mongoose.Schema.ObjectId,ref:'account',default:null}]
});