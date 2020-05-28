var connect = require('../connector');
var schema = require('../schema/accountFTP');

module.exports = connect.model('accountFTP',schema,'accountFTP');