var connect = require('../connector');
var schema = require('../schema/cashIn');

module.exports = connect.model('cashIn',schema,'cashIn');