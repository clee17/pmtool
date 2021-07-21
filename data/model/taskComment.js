var connect = require('../connector');
var schema = require('../schema/taskComment');

module.exports = connect.model('taskComment',schema,'taskComment');