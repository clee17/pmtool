var connect = require('../connector');
var schema = require('../schema/doc');

module.exports = connect.model('doc',schema,'doc');