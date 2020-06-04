var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    QA:{type:mongoose.Schema.ObjectId,ref:'QA',default:null},
    report:{type:mongoose.Schema.ObjectId,ref:'reports',default:null},
    submitter:{type:mongoose.Schema.ObjectId,ref:'user',default:null}
});