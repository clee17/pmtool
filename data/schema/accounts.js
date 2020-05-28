var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {type:String,default:""},
    alias:{type:String,default:""},
    country:{type:Number,default:1}, // 1 US 54 Argentina, 81 Japan
    parent: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    official:{type:String,default:""},
    priority:{type:Number,default:0},
    type:{type:Number,default:0},//0 account, 1, partner; saved for further use
    description:{type:String,default:""}
});