	const express = require('express');
const router = express.Router();
const util = require('util')
const sql = require('../db/mysql-db');
const https = require('https');
const base32 = require('base-32').default;
const guid = require('uuid/v1');
const bcrypt = require('bcrypt');

const passport = require('passport');

const User = require('../models/user');
const AuthCode = require('../models/auth-code');
const SysAdmin = require('../models/sys-admin');

/******************
*
*	GET
*
*******************/

router.get('/login', function (req, res){
	
	console.log('GET /login');
	
	if(req.isAuthenticated()) res.redirect('/users');

	res.render('admin/login', { 
		message: req.flash('loginMessage')
	});
});

router.get('/logout', function(req, res){
	console.log('GET /logout');

	req.logout();
  	res.redirect('/login');
});

router.get('/users', isLoggedIn, async (req, res, next) => {
	console.log('GET /users');

	try{
		let users = await getUsers();
		for(let i = 0; i < users.length; i++){
			let room = await getRoomById(users[i].room_assign);
			users[i].room_raw = room;
			users[i].password = base32.decode(users[i].password);
		}

		res.render('admin/user', {
			page: 'users',
			users: users,
			message: {
				status: req.flash('status'),
				message: req.flash('message')
			}
		});
	}catch (error){
		console.log(error)
		res.json({"error" : "Something went wrong"});
	}
});

router.get('/users/new', isLoggedIn, async (req, res, next) => {
	console.log('GET /users/new');

	try{
		let rooms = await getRooms();
		res.render('admin/user/new', {
			page: 'users',
			rooms: rooms
		});
	}catch(error){

	}
});

router.get('/users/:id/setting', isLoggedIn, async (req, res) => {
	let id = req.params.id;

	console.log('GET /users/' + id + '/setting');

	try {
		let user = await getUserById(id);
		let rooms = await getRooms();
		res.render('admin/user/setting', {
			page: 'users',
			user: user,
			rooms: rooms
		});
	} catch(error){
		console.log(error);
	}
});

router.get('/rooms', isLoggedIn, async (req, res, next) => {
	console.log('GET /rooms');

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

router.get('/rooms/:id/show', isLoggedIn, async (req, res, next) => {

	let id = req.params.id;
	console.log('GET /rooms/' + id + '/show');

	try{
		let devicesRaw = await getDevicesByRoomId(id);
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
				name : devicesRaw[i].location_name,
				parent_location : devicesRaw[i].parent_location,
				location_type : devicesRaw[i].location_type,
				created_at : devicesRaw[i].created_at,
				updated_at : devicesRaw[i].updated_at,
				node : nodes,
				g4module : g4modules
			}

			//console.log(temp.node);
			devices.push(temp);
		}

		res.render('admin/room/show', {
			page: 'rooms',
			devices: devices
		});
		
	}catch(error){
		console.log(error);
	}
});

/******************
*
*	POST
*
*******************/

router.post('/login', passport.authenticate('local-login', {
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}), function(req, res){
	res.redirect('/users');
});

router.post('/users/save', isLoggedIn, function (req, res) {
	console.log('POST /users/save');

	try{
		let newUser = new User;
		newUser.username = req.body.username;
		newUser.password = base32.encode(req.body.password);
		newUser.room_assign = req.body.room;
		newUser.token = generateToken();
		newUser.save(function(err, user){
			if(err) res.status(500);

			req.flash('status', 'success');
			req.flash('message', 'New User Successfully added.');

			res.json(user);
		});

		
	}catch(error){
		console.log('error', error);
		res.status(500);
	}
});

/******************
*
*	PUT
*
*******************/

router.put('/users/:id/update', isLoggedIn, function (req, res){
	let id = req.params.id;

	console.log('PUT /user/' + id + '/update');

	User.findById(id, function(err, user){
		if(err) res.status(500);

		user.room_assign = req.body.room;
		user.status = req.body.status;
		user.updated_at = Date.now();
		user.save(function (err, result){
			if(err) res.status(500);

			req.flash('status', 'success');
			req.flash('message', 'User Successfully Updated.');
			res.json({status: true});
		});		
	});
});

router.put('/users/:id/change-password', isLoggedIn, function (req, res){
	let id = req.params.id;

	console.log('PUT /user/' + id + '/change-password');

	User.findById(id, function(err, user){
		if(err) res.status(500);

		user.password = base32.encode(req.body.password);
		user.updated_at = Date.now();
		user.save();
		req.flash('status', 'success');
		req.flash('message', 'User Password Successfully Changed.');
		res.json({status: true});	
	});
});

/******************
*
*	DELETE
*
*******************/

router.delete('/users/:id/delete', isLoggedIn, function (req, res) {
	let id = req.params.id;

	console.log('DELETE /user/' + id + '/delete');

	User.deleteOne({'_id': id}, function(err) {
		if(err) res.status(500);
		res.status(200).json({status: true});
	});
});


/******************
*
*	FUNCTIONS
*
*******************/

let getUserById = function(id){
	return new Promise((resolve, reject) => {
		User.findById(id, function(err, res){
			if(err) reject(err);
			resolve(res);
		});
	});
}

let generateToken = function (){
	return {
		access_token: guid(),
		refresh_token: guid()
	};
}

let getRoomById = function(id){
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM locations WHERE id = ?";
		sql.query(query, [id], function (error, results, fields) {
		  if (error) reject(error);
		  resolve(results);
		});
	});
};

let getRooms = function(){
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

let getRoomByParentLocation = function(id){
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM locations WHERE parent_location = ?";
		sql.query(query, [id], function (error, results, fields) {
		  if (error) throw(error);
		  resolve(results);
		});
	});
};

let getUsers = function(){
	return new Promise((resolve, reject) => {
		User.find(function(err, res){
			if(err) reject(error);
			resolve(res);
		}).sort('-created_at');
	});
};

let getUserByAccessToken = function(access_token){
	return new Promise((resolve, reject) => {
		User.findOne({ 'token.access_token': access_token }, function(err, res){
			if(err) reject("user not found!");
			resolve(res)
		});
	});
}

let getDevicesByRoomId = function(roomId){
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM locations WHERE parent_location = ?';

		sql.query(query, [roomId], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results);
		});
	});
}

let getNodeByDeviceId = function(id){
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM nodes WHERE id = ?';

		sql.query(query, [id], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results[0]);
		});
	});
}

let getG4ModuleByNodeId = function(id){
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM g4modules WHERE id = ?';

		sql.query(query, [id], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results[0]);
		});
	});
}

// route middleware to make sure
function isLoggedIn(req, res, next) {

	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/login');
}

module.exports = router;