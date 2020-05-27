var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    address:{type:String,default:""},
    priority:{type:Number,default:0},
});