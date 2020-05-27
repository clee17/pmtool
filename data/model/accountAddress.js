var connect = require('../connector');
var schema = require('../schema/accountAddress');

module.exports = connect.model('accountAddress',schema,'accountAddress');