var connect = require('../connector');
var schema = require('../schema/projectComment');

module.exports = connect.model('projectComment',schema,'projectComment');