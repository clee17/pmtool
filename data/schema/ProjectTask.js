var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    updated:{type:Date,default:Date.now()},
    task: {type:mongoose.Schema.ObjectId,ref:'developerTask',default:null},
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null}
});