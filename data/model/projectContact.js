var connect = require('../connector');
var schema = require('../schema/projectContact');

module.exports = connect.model('projectContact',schema,'projectContact');