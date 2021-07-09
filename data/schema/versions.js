var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    product: {type:mongoose.Schema.ObjectId,ref:'product',default:null},
    name:{type:String,default:""},
    version:{
        main:{type:Number,default:-1},
        update:{type:Number,default:-1},
        fix:{type:Number,default:-1}},
    priority:{type:Number,default:1},
    date:{type:Date,default:Date.now()},
    developers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}],
    description:{type:String,default:""},
    link:{type:String,default:""},
    position: {type:mongoose.Schema.ObjectId,ref:'position',default:null},
});