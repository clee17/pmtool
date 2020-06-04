var connect = require('../connector');
var schema = require('../schema/QAEngineer');

module.exports = connect.model('QATester',schema,'QATester');