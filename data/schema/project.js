var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name:{type:String,default:""},
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    priority:{type:Number,default:0},
    schedule:{type:Date,default:Date.now()},
    contacts:[{type:mongoose.Schema.ObjectId,ref:'contacts',default:null}],
    developers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}],
    products:[{type:mongoose.Schema.ObjectId,ref:'product',default:null}],
    status: {type:Number,default:0},
    suppliers:[{type:mongoose.Schema.ObjectId,ref:'account',default:null}],
    contract:[{
        validFrom:{type:Date,default:Date.now()},
        validUntil:{type:Date,default:Date.now()},
        link:{type:String,default:""}
    }]
});