var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    version:{
        main:{type:Number,default:1},
        update:{type:Number,default:0},
        fix:{type:Number,default:0}},
    priority:{type:Number,default:1},
    date:{type:Date,default:Date.now()},
    developers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}],
    description:{type:String,default:""},
    position:{type:String,default:""}
});