var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    priority:{type:Number,default:0},
    schedule:{type:Date,default:Date.now()},
    contacts:[{type:mongoose.Schema.ObjectId,ref:'contacts',default:null}],
    developers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}],
    product:{type:mongoose.Schema.ObjectId,ref:'products',default:null},
    status: {type:Number,default:0},
    suppliers:[{type:mongoose.Schema.ObjectId,ref:'account',default:null}],
    validFrom:{type:Date,default:Date.now()},
    validUntil:{type:Date,default:Date.now()},
    contract:[]
});