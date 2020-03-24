var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {type:String,default:""},
    party: {type:mongoose.Schema.ObjectId,ref:'party',default:null},
    priority:{type:Number,default:0},
    schedule:{type:Date,default:Date.now()},
    contatcts:[{type:mongoose.Schema.ObjectId,ref:'contacts',default:null}],
    developers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}],
    product:{type:mongoose.Schema.ObjectId,ref:'products',default:null},
    status: {type:Number,default:0},
    background:{type:String,default:""}
});