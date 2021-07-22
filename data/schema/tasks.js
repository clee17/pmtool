var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    description:{type:String,default:""},
    dueOn:{type:Date,default:null},
    schedule:{type:Date,default:Date.now()},
    children:[{type:mongoose.Schema.ObjectId,ref:'tasks',default:null}],
    parent:[{type:mongoose.Schema.ObjectId,ref:'tasks',default:null}],
    type:{type:Number,default:0}, //0 issue; 1, requirement; 2, release 3 QA
    status:{type:Number,default:0},//0.review & QA; 1 engineer Assigned; 2. QA. 3. feedback; 4 Closed; 5: pending
    submitter:{type:mongoose.Schema.ObjectId,ref:'user',default:null},
    account: [{type:mongoose.Schema.ObjectId,ref:'account',default:null}],
    project: [{type:mongoose.Schema.ObjectId,ref:'project',default:null}],
    version:[{type:mongoose.Schema.ObjectId,ref:'version',default:null}],
    product:[{type:mongoose.Schema.ObjectId,ref:'product',default:null}],
    attachments:[{type:mongoose.Schema.ObjectId,ref:'attachments',default:null}]
},{
    timestamps:{createdAt:true,updatedAt:true}
});