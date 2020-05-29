var connect = require('../connector');
var schema = require('../schema/position');

module.exports = connect.model('position',schema,'position');