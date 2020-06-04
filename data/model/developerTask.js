var connect = require('../connector');
var schema = require('../schema/developerTask');

module.exports = connect.model('developerTask',schema,'developerTask');