var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {type:String,default:""},
    type:{type:Number,default:0}, //0 DTV Player; 2 decoders and encoders of audio; 4 decoders and encoders of video 4 sync 5 service 6 unitests 7,other
    market:[{type:String,default:""}],
    resources:[{type:mongoose.Schema.ObjectId,default:null,ref:'storage'}],
    description: {type:String,default:""},
    supported:{type:Boolean,default:true}
});