var connect = require('../connector');
var schema = require('../schema/party');

module.exports = connect.model('party',schema,'party');