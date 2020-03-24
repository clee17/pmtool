var connect = require('../connector');
var schema = require('../schema/department');

module.exports = connect.model('department',schema,'department');