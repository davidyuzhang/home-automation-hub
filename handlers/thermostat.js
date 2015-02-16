var util = require('util'),
    fs = require('fs');

var config = fs.existsSync(__dirname + '/../config.production.js') ? require('/../config.production.js') : require('../config');

var Handler = {
}

module.exports = Handler;
