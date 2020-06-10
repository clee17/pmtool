var connect = require('../connector');
var schema = require('../schema/userCredential');

module.exports = connect.model('userCredential',schema,'userCredential');