var connect = require('../connector');
var schema = require('../schema/accounting_collection');

module.exports = connect.model('accounting_collection',schema,'accounting_collection');