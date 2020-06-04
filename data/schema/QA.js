var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    version:{type:mongoose.Schema.ObjectId,ref:'version',default:null},
    date:{type:Date,default:Date.now()},
    type:{type:Number,default:0},
    priority:{type:Number,default:0},
    status:{type:Number,default:0}, //0刚提交，
    start:{type:Date,default:Date.now()},
    end:{type:Date,default:Date.now()},
    comment:{type:String,default:""},
    submitter:{type:mongoose.Schema.ObjectId,ref:'user',default:null},
    owner:{type:mongoose.Schema.ObjectId,ref:'user',default:null}
});