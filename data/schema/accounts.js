var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {type:String,default:""},
    head:{type:String,default:""},
    priority:{type:Number,default:0}
});