var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {type:String,default:""},
    description: {type:String,default:""},
});