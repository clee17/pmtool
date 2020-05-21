var connect = require('../connector');
var schema = require('../schema/paymentDocs');

module.exports = connect.model('paymentDocs',schema,'paymentDocs');