var connect = require('../connector');
var schema = require('../schema/location');

module.exports = connect.model('location',schema,'location');