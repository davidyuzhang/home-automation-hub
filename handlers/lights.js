var Insteon = require('home-controller').Insteon,
    fs = require('fs'),
    async = require('async'),
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
  },

  // Handles the lights_change_relative intent (i.e. "Dim the hallway lights") from the user.
  // We require a room and a direction entity in this intent.
  //
  lights_change_relative: function(response, callback) { 
    console.log('[wit.lights_change_relative] response=%s', util.inspect(response, { depth: 3 } ));

    var room = response.entities.room ? response.entities.room[0].value : response.entities.local_search_query[0].value;
    var direction = response.entities.direction[0].value;

    var light_detail = findByName(lights, room);

    console.log(util.format('[wit.lights_change_relative] Setting lights in %s to %s light_obj:%s', room, direction, util.inspect(light_detail)));

    if (light_detail) {
      var light = hub.light(light_detail.id);
      light.level().then(function(level) {
        var new_level = direction == 'up' ? Math.min(100, level + 25) : Math.max(0, level - 25);
        console.log('[wit.lights_change_relative] current level is %d, setting to %d', level, new_level);
        light.level(new_level);
	callback(util.format('turning %s lights %s', room, new_level));
      });
    } else {
      callback(util.format('sorry, i\'m not sure what light that is'));
    }
  },

  // Handles the lights_change_with_level intent (i.e. "Set the kitchen lights to 65%") from the
  // user.  We require a room and a level for this intent.
  //
  lights_change_with_level: function(response, callback) { 
    console.log('[wit.lights_change_with_level] response=%s', util.inspect(response, { depth: 3 } ));

    var room = response.entities.room ? response.entities.room[0].value : response.entities.local_search_query[0].value;
    var level = response.entities.level[0].value;

    var light_detail = findByName(lights, room);

    console.log(util.format('[wit.lights_change_with_level] Setting lights in %s to %s light_obj:%s', room, level, util.inspect(light_detail)));

    if (light_detail) {
      var light = hub.light(light_detail.id);
      light.level(level);
      callback(util.format('turning %s lights %s', room, level));
    } else {
      callback(util.format('sorry, i\'m not sure what light that is'));
    }
  },

  // Handles the lights_change_all intent (i.e. "Turn off all of the lights") from the user.
  // We require a on_off entity to set the lights to the right state.
  // 
  lights_change_all: function(response, callback) {
    console.log('[wit.lights_change_all] response=%s', util.inspect(response, { depth: 3 } ));

    var state = response.entities.on_off[0].value;

    for (var i in lights) {
      var item = lights[i];
      if (state == "toggle") {
        // Todo: Add switch logic
      } else {
        var light = hub.light(item.id);
        if (state == "on") {
          light.turnOn();
        } else {
          light.turnOff();
        }
      }  
    }

    callback('Set all of the lights in the house')
  },

  // Handles the lights_query_all intent from the user.
  lights_query_all: function(response, callback) { 
    console.log('[wit.lights_query_all] response=%s', util.inspect(response, { depth: 3 } ));
    var state = response.entities.on_off[0].value;

    // Used in async.map to fetch all of the light results in parallel
    var fn = function(i, c) {
      console.log('[wit.lights_query_all] fetching details for light %s', util.inspect(i));

      if (i.id == "") {
        c(null, { light: i, state: "unknown" });
      } else { 
        hub.light(i.id).level().then(function (l) { 
          c(null, { light: i, state: l });
        });
      }
    };

    async.map(lights, fn, function(error, results) { 
       console.log(util.inspect(results, { depth: 3 }));
       var text = results.reduce(function (p, c, i) { 
         // If the user only requests lights that are on
         if (state == "on") { 
           if (c.state > 0) {
             return p + ', ' + c.light.name + ' is on';
           }
         } else if (state == "off") { 
           if (c.state == 0) {
             return p + ', ' + c.light.name + ' is off'; 
           }
         } else { 
           if (c.state == 0) { 
             return p + ', ' + c.light.name + ' is off'; 
           } 
           if (c.state > 0) { 
             return p + ', ' + c.light.name + ' is on';
           }
         } 
         return p;
       }, "");
       console.log(text);
       callback(text);
    });
  },

  // Handles requests to change the scenes inside of the house (i.e. set scene away,
  // set scene home). We require a scene entity to map to the correct scene ID on the insteon
  // hub. 
  //
  scene_change: function(response, callback) { 
    console.log('[wit.scene_change] response=%s', util.inspect(response, { depth: 3 } ));

    var scene = response.entities.scene[0].value;
    var scene_detail = findByName(scenes, scene);
    
    console.log(util.format('[wit.scene_change] Setting scene in %s %s', scene, util.inspect(scene_detail)));

    if (scene_detail) {
      hub.sceneOn(scene_detail.id);
      callback(util.format('Set the scene %s', scene));
    } else { 
      callback('Not sure what scene that is');
    }
  }
}

module.exports = Handler;
