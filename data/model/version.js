var connect = require('../connector');
var schema = require('../schema/versions');

module.exports = connect.model('version',schema,'version');