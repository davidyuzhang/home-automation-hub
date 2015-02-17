var config = {};
config.wit = {};
config.nest = {};
config.app = {};
config.insteon = {};
config.insteon.lights = [];
config.insteon.scenes = [];

// Configuration for the web service part of the code
config.app.listen_port = 30001;
config.app.use_ssl = true;
config.app.private_key = "private.pem";
config.app.public_cert = "certificate.pem";
config.app.accepted_security_token = [""];

// Access token for connecting to wit.ai service, we use this
// for translating queries from our service /?q=turn+on+lights
// into the appropriate actions. 
//
// Bootstrap this by going to wit.ai and cloning the following
// service, then provide your own API key here.
//
config.wit.access_token = "SECRET_KEY";
config.wit.min_confidence_threshold = 0.5;

// Nest thermostat configuration used to configure our service
// to connect to nest api to set thermostat remotely
config.nest.username = 'user@user.com';
config.nest.password = 'PASSWORD_TO_NEST';

// module for connecting to our insteon network.
//
// {
//   hub_type: "plm" 
//   hub_ip: ip_addr_of_hub
//   hub_port: port_of_hub
// }
//
config.insteon.hub_type = 'plm';
config.insteon.hub_ip = '50.170.31.3';
config.insteon.hub_port = 9761;

// Config mapping for the different lights. We don't support
// automatic discovery of configured scenes and lights in the
// network so its up to you to discover this.
//
config.insteon.lights = [
 { id: '000001', name: 'hallway', aliases: []},
 { id: '000002', name: 'living room', aliases: []},
 { id: '000003', name: 'kitchen', aliases: [] },
 { id: '000004', name: 'bedroom', aliases: []},
];

config.insteon.scenes = [
 { id: '1', name: 'movie', aliases: []}
];

module.exports = config;
