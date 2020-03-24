var connect = require('../connector');
var schema = require('../schema/product');

module.exports = connect.model('product',schema,'product');