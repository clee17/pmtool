var connect = require('../connector');
var schema = require('../schema/delivery');

module.exports = connect.model('delivery',schema,'delivery');