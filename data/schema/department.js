var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {type:String,default:""},
    function:[{type:Number,default:0}] // 0 CEO 1 CTO 2 CSO Development 3 QA 4
});