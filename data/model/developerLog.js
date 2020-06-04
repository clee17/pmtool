var connect = require('../connector');
var schema = require('../schema/developerLog');

module.exports = connect.model('developerLog',schema,'developerLog');