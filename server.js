var Insteon = require('home-controller').Insteon;
var util = require('util');
var fs = require('fs');
var hub = new Insteon();
var express = require('express');
var wit = require('node-wit');
var EventEmitter = require('events').EventEmitter;
var app = express();
var colors = require('colors');

var config = fs.existsSync(__dirname + '/config.production.js') ? require('./config.production.js') : require('./config');

var WitIntentResponder = function WitIntentResponder(access_token, confidence_threshold) {
  EventEmitter.call(this);

  this.handlers = {};
  this.confidence_threshold = confidence_threshold;
  this.witApiKey = access_token;

  this.setIntentHandler = function(intent, fn) {
    if (fn)
    {
      this.handlers[intent] = fn;
    }
  }

  this.processText = function(text, callback) {
    var self = this; 

    wit.captureTextIntent(this.witApiKey, text, function(error, response) { 
      if (error) {
        console.log(error);
      }

      if (response.outcomes) { 
        var o = response.outcomes[0];
        
        if (o.confidence > self.confidence_threshold && self.handlers[o.intent]) {
          var ret = self.handlers[o.intent](o, callback);
        }
      }
    });
  }
};

var responder = new WitIntentResponder(config.wit.access_token, config.wit.min_confidence_threshold);

var handler = require('./handlers/lights.js');
for (var property in handler) {
  if (handler.hasOwnProperty(property)) { 
      if (handler[property].length != 2) { 
        console.log('[wit] handler function %s doesn\'t have the required number of arguments, skipping');
        continue;
      }

      console.log(colors.green('[wit] adding handler %s'), property);
      responder.setIntentHandler(property, handler[property]);
  } 
}

app.get('/request', function(req, res) {
  var query = req.query.q;
  console.log('[/request] got query = %s', query);
  responder.processText(query, function(ret) {
    res.send(ret);
  });   
});

app.get('/lights/:id', function(req, res) {
  console.log('Getting status of light %s', req.params.id); 
  var def = findByName(lights, req.params.id);

  if (def) {
    var light = hub.light(def.id);
    light.level().then(function(level) {
      console.log('Fetched light level for %s to be %d', req.params.id, level);
      res.send({
        result: 'ok',
        light: def.name,
        level: level,
        is_on: level > 0
      });
    });
  }
  
});

app.get('/lights/:id/on', function(req, res) {
  console.log('Attempting to turn on light %s', req.params.id);
  var def = findByName(lights, req.params.id);
  if (def) {
    var light = hub.light(def.id);
    light.turnOn();
  }
  res.send({
    result: 'ok',
    light: def.name
  });
});

app.get('/lights/:id/off', function(req, res) {
  console.log('Attempting to turn off light %s', req.params.id);
  var def = findByName(lights, req.params.id);
  if (def) {
    var light = hub.light(def.id);
    light.turnOff();
  }
  res.send({
    result: 'ok',
    light: def.name
  });
});

var server = app.listen(config.app.listen_port, '0.0.0.0', function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Home-automation application listening at http://%s:%s', host, port) 
});
