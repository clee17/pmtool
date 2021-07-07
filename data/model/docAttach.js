var connect = require('../connector');
var schema = require('../schema/docAttach');

module.exports = connect.model('attach',schema,'attach');