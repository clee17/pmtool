var connect = require('../connector');
var schema = require('../schema/payment');

module.exports = connect.model('payment',schema,'payment');