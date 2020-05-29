var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    source:{type:Number,default:0}, 
    link:{type:String,default:""},
});