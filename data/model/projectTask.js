var connect = require('../connector');
var schema = require('../schema/projectTask');

module.exports = connect.model('projectTask',schema,'projectTask');