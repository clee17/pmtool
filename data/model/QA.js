var connect = require('../connector');
var schema = require('../schema/QA');

module.exports = connect.model('QA',schema,'QA');