var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    version:{type:mongoose.Schema.ObjectId,ref:'version',default:null},
    date : {type:Date,default:Date.now()},
    start:{type:Date,default:Date.now()},
    end:{type:Date,default:Date.now()},
    description:{type:String,default:""},
    Testers:[{type:mongoose.Schema.ObjectId,ref:'user',default:null}]
});