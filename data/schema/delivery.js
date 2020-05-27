var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    project: {type:mongoose.Schema.ObjectId,ref:'project',default:null},
    name: {type:String,default:""},
    type:{type:Number,default:0}, //0, DTV player, 1, decoder/encoders  2,
    market:[{type:String,default:""}],
    OS:{type:Number,default:0},
    platform:{type:String,default:""},
    tuner:{type:Number,default:0},
    description: {type:String,default:""},
});