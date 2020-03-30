var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title: {type:String,default:""},
    company:{type:mongoose.Schema.ObjectId,default:null,ref:"account"},
    name : {type:String,default:""},
    alias:{type:String,default:""},
    number:{type:Number,default:-1},
    mail:{type:String,default:""},
    otherContacts:{QQ:{type:String,default:""},wechat:{type:String,default:""}},
    location:{type:String,default:""},
    preferredLanguage:{type:Number,default:0} //0 EN 1 CN 2 JP 3 IT
});