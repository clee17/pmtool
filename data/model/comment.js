var connect = require('../connector');
var schema = require('../schema/comment');

module.exports = connect.model('contacts',schema,'comment');