var connect = require('../connector');
var schema = require('../schema/efforts');

module.exports = connect.model('efforts',schema,'efforts');