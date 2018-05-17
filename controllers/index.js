const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const util = require('util')
const sql = require('../db/mysql-db.js');
const https = require('https');
const base32 = require('base-32').default;

const User = require('../models/user.js');
const AuthCode = require('../models/auth-code.js');

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json({type: 'application/json'}));


router.get('/login', function (req, res){

	res.render('admin/login');
});

router.get('/users', async (req, res, next) => {

	try{
		let users = await getUsers();
		for(let i = 0; i < users.length; i++){
			let room = await getRoomById(users[i].room_assign);
			users[i].room_raw = room;
			users[i].password = base32.decode(users[i].password);
		}
		//res.json(devices);
		res.render('admin/user', {
			page: 'users',
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
			page: 'users',
			rooms: rooms
		});
	}catch(error){

	}
});

router.post('/users/save', function (req, res) {

	let newUser = new User;
	newUser.username = req.body.username;
	newUser.password = base32.encode(req.body.password);
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
			page: 'rooms',
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
		query += "WHERE l1.location_type = 1 AND l1.parent_location != 'NULL'";
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

module.exports = router;