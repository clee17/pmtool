var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {type:String,default:""},
    type:{type:Number,default:0}, //0, DTV player, 1, decoder/encoders  2,
    product:[{type:mongoose.Schema.ObjectId,default:null,ref:'product'}],
    description: {type:String,default:""},
    market:[{type:String,default:""}],
    OS:{type:Number,default:0},
    platform:{type:String,default:""},
    tuner:{type:Number,default:0},
    estimatedDT:{type:Date,default:null}
});