var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    user:{type:mongoose.Schema.ObjectId,ref:'user',default:null}
});