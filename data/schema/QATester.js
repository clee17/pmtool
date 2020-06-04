var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    QA:{type:mongoose.Schema.ObjectId,ref:'QA',default:null},
    user:{type:mongoose.Schema.ObjectId,ref:'user',default:null}
});