var connect = require('../connector');
var schema = require('../schema/user');

module.exports = connect.model('user',schema,'user');