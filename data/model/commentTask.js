var connect = require('../connector');
var schema = require('../schema/commentTask');

module.exports = connect.model('commentTask',schema,'commentTask');