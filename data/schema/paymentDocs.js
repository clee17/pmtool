var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    payment: {type:mongoose.Schema.ObjectId,ref:'payment',default:null},
    doc: {type:mongoose.Schema.ObjectId,ref:'doc',default:null},
    type:{type:Number,default:0} // 0 invoice, 1 documents,主要是royalty之类杂七杂八的, 2 收寄证明
});