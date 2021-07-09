var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,ref:'user',default:null},
    task: {type:mongoose.Schema.ObjectId,ref:'tasks',default:null},
    schedule:{type:Date,default:Date.now()},
    comment:{type:String,default:""},
    attachments:[{type:mongoose.Schema.ObjectId,ref:'attach',default:null}],
},{
    timestamps:true
});