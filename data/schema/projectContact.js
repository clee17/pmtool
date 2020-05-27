var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    priority:{type:Number,default:1},
    contact: {type:mongoose.Schema.ObjectId,ref:'contacts',default:null},
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
});