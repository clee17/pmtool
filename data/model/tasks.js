var connect = require('../connector');
var schema = require('../schema/tasks');

module.exports = connect.model('tasks',schema,'tasks');