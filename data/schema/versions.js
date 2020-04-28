var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    versions:{
        root:{type:Number,default:1},
        second:{type:Number,default:0},
        third:{type:Number,default:0}},
    time:{type:Date,default:Date.now()},
    release:{type,String,default:""},
    developers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}],
    Description:{type:String,default:""}
});