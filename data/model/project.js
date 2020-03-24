var connect = require('../connector');
var schema = require('../schema/project');

module.exports = connect.model('project',schema,'project');