var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    description:{type:String,default:""},
    dueOn:{type:Date,default:null},
    schedule:{type:Date,default:Date.now()},
    type:{type:Number,default:0}, //0 new feature; 1, issue; 2, QA submission
    status:{type:Number,default:0},//review & QA; 2 engineer Assigned; 3. Verification. 4. Pending; 5 Closed
    submitter:{type:mongoose.Schema.ObjectId,ref:'user',default:null},
    account: {type:mongoose.Schema.ObjectId,ref:'account',default:null},
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    version:{type:mongoose.Schema.ObjectId,ref:'version',default:null},
    product:{type:mongoose.Schema.ObjectId,ref:'product',default:null}
},{
    timestamps:{createdAt:true,updatedAt:true}
});