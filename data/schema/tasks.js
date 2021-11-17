var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    description:{type:String,default:""},
    dueOn:{type:Date,default:null},
    completed:{type:Date,default:null},
    plan:{start:{type:Date,default:Date.now()},end:{type:Date,default:Date.now()+7*24*60*60*1000},hours:{type:Number,default:5*8},engineers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}]},
    schedule:{type:Date,default:Date.now()},
    parent:[{type:mongoose.Schema.ObjectId,ref:'tasks',default:null}],
    children:[{type:mongoose.Schema.ObjectId,ref:'tasks',default:null}],
    type:{type:Number,default:0}, //0 issue; 1, requirement; 2, release 3 QA 4 asset
    progress:{type:Number,default:0},
    hours:{type:Number,default:0},
    status:{type:Number,default:0},//0.review & QA; 1 engineer Assigned; 2. QA. 3. feedback; 4 Closed; 5: pending 6:completed
    submitter:{type:mongoose.Schema.ObjectId,ref:'user',default:null},
    engineers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}],
    engineer:{type:mongoose.Schema.ObjectId,ref:'user',default:null}, //wbs bottom level task will use this field, only 1 engineer will be responsible for the task.
    account: [{type:mongoose.Schema.ObjectId,ref:'account',default:null}],
    project: [{type:mongoose.Schema.ObjectId,ref:'project',default:null}],
    version:[{type:mongoose.Schema.ObjectId,ref:'version',default:null}],
    product:[{type:mongoose.Schema.ObjectId,ref:'product',default:null}],
    attachments:[{type:mongoose.Schema.ObjectId,ref:'attachments',default:null}]
},{
    timestamps:{createdAt:true,updatedAt:true}
});