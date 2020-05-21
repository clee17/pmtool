var connect = require('../connector');
var schema = require('../schema/versionTask');

module.exports = connect.model('versionTask',schema,'versionTask');