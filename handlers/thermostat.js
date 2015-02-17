var util = require('util'),
    nest = require('unofficial-nest-api'),
    fs = require('fs');

var config = fs.existsSync(__dirname + '/../config.production.js') ? require(__dirname + '/../config.production.js') : require(__dirname + '/../config');

console.log('[nest] logging into nest service as %s', config.nest.username);

nest.login(config.nest.username, config.nest.password, function (error, data) { 
  if (error) {
    console.log('[nest] failed to connect - %s', error.message);
  }
});

var Handler = {
  // Handles the thermostat_presence_change intent (i.e. "Set the thermostat to away") from the user.
  // This handler requires a single entity mapping to the expected state.
  //
  thermostat_presence_change: function(response, callback) {
    console.log('[nest.thermostat_presence_change] response=%s', util.inspect(response, { depth: 2 } ));
    
    var presence = response.entities.away_home[0].value;
    nest.fetchStatus(function (data) {
      if (presence  == 'away') {
        nest.setAway();
      } else { 
        nest.setHome();
      }
      callback(util.format('Set the thermostat to %s', presence));
    });
  },
}

module.exports = Handler;
