var Insteon = require('home-controller').Insteon,
    fs = require('fs'),
    hub = new Insteon(),
    util = require('util');

var config = fs.existsSync(__dirname + '/../config.production.js') ? require(__dirname + '/../config.production.js') : require(__dirname + '/../config');

var lights = config.insteon.lights;
var scenes = config.insteon.scenes;

// Connect to the insteon hub and then do a quick validation that we can talk to
// devices on the network.
//
console.log('[insteon] attempting to connect to hub at %s:%s', config.insteon.hub_ip, config.insteon.hub_port);
hub.connect(config.insteon.hub_ip, config.insteon.hub_port, function() { 
  console.log('Connected to insteon...');

  lights.forEach(function(entry) {
    if (entry.id)
    {
      console.log('Monitoring light ' + entry.name + ' to monitored set');
      var light = hub.light(entry.id);
      
      light.on('turnOn', function() {
	console.log('The ' + entry.name + ' light was turned on');
      });

      light.on('turnOff', function() {
	console.log('The ' + entry.name + ' light was turned off');
      });
    }
  });
});

function findByName(source, name) {
  for (var i = 0; i < source.length; i++) {
    if (source[i].name.toUpperCase() === util.format('%s', name).toUpperCase()) {
      return source[i];
    }
  }
}

// The functions that are exposed back to the home automation service. The property names
// map back to intents from the wit.ai service.
// 
var Handler = {

  // Handles the lights_query intent (i.e. "Are the hallway lights on?") from the user.
  // This handler requires a single entity mapping to the room of interest.
  //
  lights_query: function(response, callback) { 
    console.log('[wit.lights_query] response=%s', util.inspect(response, { depth: 2 } ));

    var room = response.entities.room[0].value;
    var light_detail = findByName(lights, room);

    console.log(util.format('[wit.lights_query] Getting lights status in %s light_obj:%s', room, util.inspect(light_detail)));
    
    if (light_detail) {
      var light = hub.light(light_detail.id);
      light.level().then(function(level) { 
	console.log('[wit.lights_query] light %s id %s is %d', room, light_detail.id, level);
	callback(util.format('the %s lights are %s', room, level > 0 ? 'on' : 'off'))
      });
    } else {
      callback(util.format('sorry, i\'m not sure what light that is'));
    }
  }, 

  // Handles the lights_change intent (i.e. "Turn on the hallway lights?") from the user. 
  // We require a single entity with role set to room which maps to the correct light.
  //
  lights_change: function(response, callback) { 
    console.log('[wit.lights_change] response=%s', util.inspect(response, { depth: 3 } ));

    var room = response.entities.room ? response.entities.room[0].value : response.entities.local_search_query[0].value;
    var state = response.entities.on_off[0].value;

    var light_detail = findByName(lights, room);

    console.log(util.format('[wit.lights_change] Setting lights in %s to %s light_obj:%s', room, state, util.inspect(light_detail)));
    
    if (light_detail) {
      var light = hub.light(light_detail.id);
      state === "on" ? light.turnOn() : light.turnOff();
      callback(util.format('turning %s lights %s', room, state));
    } else {
      callback(util.format('sorry, i\'m not sure what light that is'));
    }
  }
}

module.exports = Handler;