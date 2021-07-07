var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name:{type:String,default:""},
    type:{type:Number,default:0}, // 0 temporary
    link:{type:String,default:""},
},{
    timestamps:{createdAt:true,updatedAt:true}
});