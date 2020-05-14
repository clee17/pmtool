var connect = require('../connector');
var schema = require('../schema/accounts2');

module.exports = connect.model('account2',schema,'account2');