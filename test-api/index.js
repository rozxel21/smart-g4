const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const util = require('util')
const sql = require('../db/mysql-db.js');
const https = require('https');
const base32 = require('base-32').default;

const User = require('../models/user.js');
const AuthCode = require('../models/auth-code.js');

const SysAdmin = require('../models/sys-admin.js');

const HashMap = require('hashmap');
const map = new HashMap();

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json({type: 'application/json'}));

const bcrypt = require('bcrypt');

router.get('/password', function (req, res){
	bcrypt.hash('icanbe23D', 10, function(err, hash){
		res.json({password: hash});
	});
});

router.get('/', function (req, res){
	let query = "SELECT DISTINCT l2.* FROM locations AS l1 ";
		query += "LEFT JOIN locations AS l2 ON l2.id = l1.parent_location ";
		query += "WHERE l1.location_type = 1 AND l1.parent_location != 'NULL'";
	
		sql.query(query, function (error, results, fields) {
		  if (error) throw(error);
		  res.json(results);
		});
});

router.get('/1', function (req, res){
	let query = "SELECT * FROM locations WHERE location_type = 1";

		sql.query(query, function (error, results, fields) {
		  if (error) throw(error);
		  res.json(results);
		});
});

router.get('/2', function (req, res){
	let query = 'SELECT l.id, n.description, n.state FROM locations AS l ';
		query += 'JOIN nodes AS n ON l.node_id = n.id ';
		query += 'WHERE l.id = 12';
	
	sql.query(query, function (error, results, fields) {
	  if (error) throw(error);
	  res.json(results);
	});
});

router.get('/3', function (req, res){
	let query = 'SELECT locations.id, nodes.description, nodes.node_type, nodes.state FROM locations ';
		query += 'JOIN nodes ON locations.node_id = nodes.id ';
		query += 'WHERE locations.id = 19 AND nodes.node_type != "NULL"';

	sql.query(query, function (error, results, fields) {
	  	if (error) throw(error);

	  	results.forEach(function(result){
	  		var tests = result.state.split(';');
	  		console.log(tests);
	  		tests.forEach(function(test){
	  			var sample = test.split(':');
	  			console.log(sample);
	  			map.set(sample[0], sample[1]);
	  		});
	  	});

	  	console.log(map.get('unit'));
	  	console.log(map.get('temp'));
	  	console.log(map.get('ac'));
	  	console.log(map.get('speed'));
	  	res.json(results);
	});
});

router.get('/4', function(req, res){
	let temp = {
		id : 1,
		type: 'action.devices.types.OUTLET',
		name: {
			defaultNames: [ 'room' ],
			name: 'living',
			nicknames: [ 'living' ]
		},
		willReportState: false,
		deviceInfo: {
			manufacturer: "Smart G4",
			model: 'g4modules.device_model',
			hwVersion: "",
			swVersion: ""
		},
		customData: {
			deviceId: 'g4modules.device_id',
			subnetId: 'g4modules.subnet_id',
			channelId: 'nodes.node_no',
			type: 'nodes.node_type'
		}
	}

	temp.attributes = {
		availableThermostatModes: "Cool,Auto,Heat,Fan",
		thermostatTemperatureUnit: "C"
	}

	res.json(temp);
});

module.exports = router;