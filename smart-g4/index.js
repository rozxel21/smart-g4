const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const util = require('util')
const sql = require('../db/mysql-db.js');
const https = require('https');

const User = require('../models/user.js');
const AuthCode = require('../models/auth-code.js');

const crc = require('../utils/crc_tool.js');
const dgram = require('dgram');
const ip = require('ip');

const HOST = '210.16.15.255';
const PORT = 6000;

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json({type: 'application/json'}));

router.post('/', async (req, res, next) => {	
	console.log('headers', req.headers);
	let requestId = req.body.requestId;
	let inputs = req.body.inputs;
	let token = req.headers.authorization.split(' ')[1];
	console.log('token: ', token);

	try{
		let user = await getUserByAccessToken(token);
		
		for(let i = 0; i < inputs.length; i++) {
			let input = inputs[i];
			let intent = input.intent;
			let data = null;
			switch (intent) {
				case 'action.devices.SYNC':
					console.log('post /smart-g4 SYNC');
					data = await sync(user, token, requestId);
					console.log(data);
					console.log(data.payload.devices);
					res.status(200).json(data);
					break;
				case 'action.devices.QUERY':
          			console.log('post /smart-g4 QUERY');
          			console.log(input.payload);
          			data = await query(user, token, requestId, input.payload.devices);
          			res.status(200).json(data);
          			break;
          		case 'action.devices.EXECUTE':
          			console.log("===========================");
          			console.log('post /smart-g4 EXECUTE');
          			data = await execute(user, token, requestId, input.payload);
          			res.status(200).json(data);
          			break;
			}
		}

	}catch(err){
		console.log(err);
	}
});


let sync = async function (user, token, requestId) {
	try{
		let devicesRaw = await getDevicesByRoomId(user.room_assign);
		let devices = new Array();

		//console.log(devices);
		for (let i = 0; i < devicesRaw.length; i++){
			let nodes = await getNodeByDeviceId(devicesRaw[i].node_id);
			let g4modules = null;

			if(nodes){
				let id =  devicesRaw[i].id
				let validateJSON = true;
				let g4modules = await getG4ModuleByNodeId(nodes.g4module_id);
				
				let type = null;
				if (nodes.description == "Dimmer"){
					type = 'action.devices.types.LIGHT';
				} else if (nodes.description == "HVAC"){
					type = 'action.devices.types.AC_UNIT';
				} else {
					validateJSON = false;
				}

				let temp = {
					id : id.toString(),
					type: type,
					traits: getDeviceTraits(type),
					name: {
						defaultNames: [ devicesRaw[i].location_name ],
						name: devicesRaw[i].location_name,
						nicknames: [ devicesRaw[i].location_name ]
					},
					willReportState: false,
					deviceInfo: {
						manufacturer: "Smart G4",
						model: g4modules.device_model,
						hwVersion: "",
						swVersion: ""
					},
					customData: {
						deviceId: g4modules.device_id,
						subnetId: g4modules.subnet_id,
						channelId: nodes.node_no
					}
				}

				if(validateJSON){
					devices.push(temp);
				}
			}
		}

		return {
			requestId: requestId,
			payload: {
				agentUserId: user.id,
				devices: devices
			}
		};
	}catch(error){
		console.log(error);
	}
}

let query = async function (user, token, requestId, devices) {

	let deviceStatus = {};
	for (let i = 0; i < devices.length; i++){
		let device = await getDeviceById(parseInt(devices[i].id));
		if (device.description == 'Dimmer'){
			let id = String(device.id);

			if (device.state > 0){	
				deviceStatus[id] = {
					on: true,
					online: true,
					brightness: device.state
				}
			} else {
				deviceStatus[id] = {
					on: false,
					online: true
				}
			}
		}
	}

	var data = {
		requestId: requestId,
		payload: {
			devices: deviceStatus
		}
	}

	console.log('response', data);
	return data;
}

let execute = async function (user, token, requestId, payload){

	let devices = payload.commands[0].devices;
	let command = payload.commands[0].execution;
	let commandJSON = new Array();
	let successId = new Array();
	let unSuccessId = new Array();
	let state = 0;
	console.log(payload);
	console.log('command', command);

	for (let i = 0; i < devices.length; i++){
		console.log('devices', devices[i]);
		console.log(command[0].command);
		switch(command[0].command){
			case 'action.devices.commands.OnOff':
				console.log(devices[i]);
				var value = 100;
				if(!command[0].params.on){
					value = 0;
				}
				var success = await sendCommandLights(devices[i].customData, value);
				if(success){
					successId.push(devices[i].id);
					state = {
						on: true,
						online: true
					}
				}else{
					unSuccessId.push(devices[i].id);
				}
				break;
			case 'action.devices.commands.BrightnessAbsolute':
				var success = await sendCommandLights(devices[i].customData, command[0].params.brightness);
				if(success){
					successId.push(devices[i].id)
					state = {
						brightness: command[0].params.brightness
					}
				}else{
					unSuccessId.push(devices[i].id);
				}
				break;
		}
	}

	let data = {
		requestId: requestId,
		payload: {
			commands: []
		}
	}

	if(successId.length != 0) data.payload.commands.push({ids: successId, status: 'SUCCESS', state: state});
	if(unSuccessId.length != 0)	data.payload.commands.push({ids: unSuccessId, status: 'OFFLINE'});
	console.log('response json', data.payload.commands);
	return data;
}

let getDevicesByRoomId = (roomId) => {
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM locations WHERE parent_location = ?';

		sql.query(query, [roomId], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results);
		});
	});
}

let sendCommandLights = (data, value) => {
	return new Promise((resolve, reject) => {
		var socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
		socket.bind(PORT);

		socket.on('listening', function(){
	        socket.setBroadcast(true);
	    });

		var ctr = 0; // status counter if packet is not found!
		socket.on("message", function (msg, rinfo) {
	        if(msg){
	        	let arr = Array.prototype.slice.call(msg, 0);
		        console.log('OPCODE', arr[21], arr[22]);
		        if (arr[21] == 0 && arr[22] == 50){
		        	console.log('SUCCESS', data);
		        	resolve(true);
		        	socket.close();
		        } else{
		        	ctr++;
		        }

		        if(ctr >= 10){
		        	console.log('Fail', ctr);
		        	resolve(false);
		        	socket.close();
		        }
	        }else{
	        	console.log('else statement');
	        	resolve(false);
	        	socket.close();
	        }
	    });

		socket.on("error", function (err) {
	    	console.log("server error:\n" + err.stack);
	    	socket.close();
	    });

	    socket.send(getPackets(data, value), PORT, HOST, function(err, bytes){
	    	console.log('\nUDP message sent to ' + HOST +':'+ PORT);
	    });
	});
}

let getPackets = function(data, value){
	let ipAddress = ip.address().split('.');
    let smartCloud = [0x53, 0x4d, 0x41, 0x52, 0x54, 0x43, 0x4c, 0x4f, 0x55, 0x44, 170, 170];
    let headerPackets = ipAddress.concat(smartCloud);
    console.log('headerPackets' ,headerPackets);
    let commandPackets = [15, 187, 187, 204, 204, 0, 49, data.subnetId, data.deviceId, data.channelId, value, 0, 0];
    let crc_data = crc.packCRC(commandPackets);
    let commandDataPackets = headerPackets.concat(commandPackets);
    let commandBuffer = new Buffer(commandDataPackets);
    return commandBuffer;
}
	

let getDeviceTraits = function (type){
	if(type == "action.devices.types.LIGHT"){
		return [
          "action.devices.traits.OnOff", "action.devices.traits.Brightness",
          "action.devices.traits.ColorTemperature",
          "action.devices.traits.ColorSpectrum"
        ];
	} else if(type == "action.devices.types.AC_UNIT"){
		return [
          "action.devices.traits.TemperatureSetting", "action.devices.traits.OnOff",
          "action.devices.traits.Modes", "action.devices.traits.Toggles",
          "action.devices.traits.FanSpeed"
        ];
	}else{
		return null;
	}
}

let getDeviceById = (id) => {
	return new Promise((resolve, reject) => {
		let query = 'SELECT locations.id, nodes.description, nodes.state FROM locations ';
			query += 'JOIN nodes ON locations.node_id = nodes.id ';
			query += 'WHERE locations.id = ?';
	
		sql.query(query, [id], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results[0]);
		});
	});
}

let getNodeByDeviceId = (id) => {
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM nodes WHERE id = ?';

		sql.query(query, [id], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results[0]);
		});
	});
}

let getG4ModuleByNodeId = (id) => {
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM g4modules WHERE id = ?';

		sql.query(query, [id], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results[0]);
		});
	});
}

let getUserByAccessToken = (access_token) => {
	return new Promise((resolve, reject) => {
		User.findOne({ 'token.access_token': access_token }, function(err, res){
			if(err) reject("user not found!");
			resolve(res)
		});
	});
}

module.exports = router;