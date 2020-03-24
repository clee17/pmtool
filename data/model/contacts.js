var connect = require('../connector');
var schema = require('../schema/contacts');

module.exports = connect.model('contacts',schema,'contacts');