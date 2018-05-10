const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const util = require('util')
const sql = require('../db/mysql-db.js');
const https = require('https');

const User = require('../models/user.js');
const AuthCode = require('../models/auth-code.js');

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json({type: 'application/json'}));

router.post('/smart-g4', async (req, res, next) => {
	
	console.log(req.body);
	let requestId = req.body.requestId;
	let inputs = req.body.inputs;
	let token = req.headers.authorization.split(' ')[1];1
	console.log('token: ', token);

	try{
		let user = await getUserByAccessToken(token);
		
		for(let i = 0; i < inputs.length; i++) {
			let input = inputs[i];
			let intent = input.intent;

			switch (intent) {
				case 'action.devices.SYNC':
					console.log('post /smart-g4 SYNC');
					let data = await sync(user, token, requestId);
					console.log(data);
					console.log(data.payload.devices);
					res.status(200).json(data);
					break;
				case 'action.devices.QUERY':
          			console.log('post /smart-g4 QUERY');
          			break;
          		case 'action.devices.EXECUTE':
          			console.log("===========================");
          			console.log('post /smart-g4 EXECUTE');
          			console.log('requestId', requestId);
          			console.log('inputs', inputs);
          			console.log('token', token);
          			console.log('data', JSON.stringify(req.body) )
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

router.get('/', function (req, res){

});

router.get('/auth', function (req, res){
	console.log(req.query);
	let client_id = req.query.client_id;
    let redirect_uri = req.query.redirect_uri;
    let state = req.query.state;
    let response_type = req.query.response_type;
    let authCode = req.query.code;

    res.redirect(util.format('/login?client_id=%s&redirect_uri=%s&redirect=%s&state=%s',
        client_id, encodeURIComponent(redirect_uri), req.path, state));
   
});

router.get('/login', function (req, res){
	console.log("=======================================================");
	console.log(req.query);

	res.render('login', {
		queryString: req.query
	});
});

router.post('/login', async (req, res, next) => {
	console.log(req.body);
	try{
		let user = await AuthenticateUser(req.body.username, req.body.password);
		console.log(user);
		if(!user){
			res.json({status: false, message: 'Incorrect username/password'});
		}else{
			//console.log(req.session);
			let authCode = generateAuthCode(user.id, req.body.client);
			req.session.user = user;
			res.json({status: true, authCode: authCode});
		}
		
	}catch(error){
		console.log(error);
	}
});

router.all('/token', async (req, res, next) => {
	console.log('==============================');
	console.log('token!');

	let client_id = req.query.client_id ? req.query.client_id : req.body.client_id;
    let client_secret = req.query.client_secret ? req.query.client_secret : req.body.client_secret;
    let grant_type = req.query.grant_type ? req.query.grant_type : req.body.grant_type;
    let auth_code = req.query.code ? req.query.code : req.body.code;

    console.log('==============================');
    console.log(req.body);
    console.log('==============================');
    console.log(req.headers);
    console.log('==============================');

	if (!client_id || !client_secret) {
      console.error('missing required parameter');
      return res.status(400).send('missing required parameter');
    }

    /*
		add client, secret authcode validation
    */
    console.log(auth_code);
    if ('authorization_code' == grant_type){
     	try{
     		var user = await getUserByAuthCode(auth_code);
     		console.log(user);
	     	res.status(200).json({
	     		token_type: "bearer",
	    		access_token: user.token[0].access_token,
	    		refresh_token: user.token[0].refresh_token
	     	});

     	}catch(error){
     		console.log(error);
     	}
    }else if ('refresh_token' == grant_type){
    	console.log('refresh_token');
    	//return handleRefreshToken(req, res);
    }else {
    	console.error('grant_type ' + grant_type + ' is not supported');
    	return res.status(400).send('grant_type ' + grant_type + ' is not supported');
    }
});

let generateAuthCode = function (user_id, client_id) {
	let authCode = Math.floor(Math.random() * 10000000000000000000000000000000000000000).toString(36);
	
	let newAuthCode = new AuthCode;
	newAuthCode.authcode = authCode;
	newAuthCode.user_id = user_id;
	newAuthCode.client_id = client_id; 
	newAuthCode.save();

	return authCode;
};


router.get('/users', async (req, res, next) => {

	try{
		let users = await getUsers();
		for(let i = 0; i < users.length; i++){
			let room = await getRoomById(users[i].room_assign);
			users[i].room_raw = room;
		}
		//res.json(devices);
		res.render('admin/user', {
			page: 'Users',
			users: users
		});
	}catch (error){
		console.log(error)
		res.json({"error" : "Something went wrong"});
	}
});

router.get('/users/new', async (req, res, next) => {

	try{
		let rooms = await getRooms();
		res.render('admin/user/new', {
			page: 'Users',
			rooms: rooms
		});
	}catch(error){

	}
});

router.post('/users/save', function (req, res) {

	let newUser = new User;
	newUser.username = req.body.username;
	newUser.password = req.body.password;
	newUser.room_assign = req.body.room;
	newUser.token = generateToken();
	newUser.save();

	res.json(newUser);
});

router.get('/rooms', async (req, res, next) => {
	try{
		let roomsRaw = await getRooms();
	
		let rooms = new Array();

		for (let i = 0; i < roomsRaw.length; i++) {
			var children = await getRoomByParentLocation(roomsRaw[i].id);
			var temp = {
				"id" : roomsRaw[i].id,
				"location_name" : roomsRaw[i].location_name,
				"description" : roomsRaw[i].description,
				"parent_location" : roomsRaw[i].parent_location,
				"location_type" : roomsRaw[i].location_type,
				"created_at" : roomsRaw[i].created_at,
				"updated_at" : roomsRaw[i].updated_at,
				"node_id" : roomsRaw[i].node_id,
				"children": children
			}

			rooms.push(temp);
		}

		res.render('admin/room', {
			page: 'Rooms',
			rooms: rooms
		});

	}catch (error){
		res.json(error);
	}
});

router.get('/rooms/:id/show', async (req, res, next) => {

	try{
		let devicesRaw = await getDevicesByRoomId(req.params.id);
		let devices = new Array();

		//console.log(devices);
		for (let i = 0; i < devicesRaw.length; i++){
			let nodes = await getNodeByDeviceId(devicesRaw[i].node_id);
			let g4modules = null;

			if(nodes){
				g4modules = await getG4ModuleByNodeId(nodes.g4module_id);
			}

			let temp = {
				id : devicesRaw[i].id,
				location_name : devicesRaw[i].location_name,
				parent_location : devicesRaw[i].parent_location,
				location_type : devicesRaw[i].location_type,
				created_at : devicesRaw[i].created_at,
				updated_at : devicesRaw[i].updated_at,
				node : nodes,
				g4module : g4modules
			}

			//console.log(temp);

			devices.push(temp);
		}

		res.json(devices);
	}catch(error){
		console.log(error);
	}
});

let generateToken = function (){
	return {
		access_token: codeGenerate(),
		refresh_token: codeGenerate()
	};
}

let getRoomById = (id) => {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM locations WHERE id = ?";
		sql.query(query, [id], function (error, results, fields) {
		  if (error) reject(error);
		  resolve(results);
		});
	});
};

let getRooms = () => {
	let query = "SELECT DISTINCT l2.* FROM locations AS l1 ";
		query += "LEFT JOIN locations AS l2 ON l2.id = l1.parent_location ";
		query += "WHERE l1.location_type = 1";
	return new Promise((resolve, reject) => {
		sql.query(query, function (error, results, fields) {
		  if (error) reject(error);
		  resolve(results);
		});
	});
};

let getRoomByParentLocation = (id) => {
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM locations WHERE parent_location = ?";
		sql.query(query, [id], function (error, results, fields) {
		  if (error) throw(error);
		  resolve(results);
		});
	});
};

let getUsers = () => {
	return new Promise((resolve, reject) => {
		User.find(function(err, res){
			if(err) reject(error);
			resolve(res);
		});
	});
};

let AuthenticateUser = (username, password) => {
	return new Promise((resolve, reject) => {
		User.findOne({ 'username': username, 'password': password }, function(err, res){
			if(err) reject("Incorrect password!");
			resolve(res);
		});
	});
};

let getUserByAuthCode = (auth_code) => {
	return new Promise((resolve, reject) => {
		AuthCode.findOne({ 'authcode': auth_code }, function(err, res){
			if(err) reject("authcode not found!");
			User.findById(res.user_id , function(err1, res1){
				if(err1) reject("user not found");
				resolve(res1);
			});
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

let getDevicesByRoomId = (roomId) => {
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM locations WHERE parent_location = ?';

		sql.query(query, [roomId], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results);
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

let codeGenerate = function(){
	return Math.floor(Math.random() * 10000000000000000000000000000000000000000).toString(36);
}


/*test*/

router.get('/test', function(req, res){
	let query = "SELECT * FROM locations ";
		query += "INNER JOIN nodes ON locations.node_id = nodes.id ";
		query += "INNER JOIN g4modules ON nodes.g4module_id = g4modules.id ";
		query += "WHERE locations.id = 12";
	
	sql.query(query, function (error, results, fields) {
		if (error) console.log(error);
		res.json(results);
	});
});

router.get('/test/node', function(req, res){
	let query = "SELECT * FROM nodes WHERE id = 1";
	
		sql.query(query, function (error, results, fields) {
		  if (error) reject(error);
		  res.json(results);
		
	});
});

router.get('/test/g4', function(req, res){
	let query = "SELECT * FROM g4modules WHERE id = 2";
	
		sql.query(query, function (error, results, fields) {
		  if (error) reject(error);
		  res.json(results);
		
	});
});

module.exports = router;