var connect = require('../connector');
var schema = require('../schema/accounts');

module.exports = connect.model('account',schema,'account');