const express = require('express');
const router = express.Router();

const util = require('util');
const https = require('https');
const base32 = require('base-32').default;

const bcrypt = require('bcrypt');
const passport = require('passport');

let uniqid = require('uniqid');
let generatePassword = require("password-generator");

const fxn = require('../fxn');

const User = require('../models/user');
const Hotel = require('../models/hotel');
const HotelAdmin = require('../models/hotel-admin');

/*
	LOGIN
*/

router.get('/sys/login', function (req, res){
	
	console.log('GET /login');
	
	if(req.isAuthenticated()) res.redirect('/hotels');

	res.render('admin/login', { 
		message: req.flash('loginMessage')
	});
});

router.get('/logout', function(req, res){
	console.log('GET /logout');
	console.log(uniqid());

	req.logout();
  	res.redirect('/sys/login');
});

/*
	HOTELS
*/

router.get('/hotels', isLoggedIn, async (req, res, next) => {
	console.log('GET /hotels');

	try{
		let hotels = await fxn.getHotels();

		res.render('admin/hotel/index', {
			page: 'hotels',
			hotels: hotels,
			message: {
				status: req.flash('status'),
				message: req.flash('message')
			}
		});
	}catch(err){
		console.log(err);
	}
});

router.get('/hotels/:id/show', isLoggedIn, async (req, res, next) => {
	let id = req.params.id;
	console.log('GET /hotels/' + id + '/show');

	try{
		let hotel = await fxn.getHotelById(id);
		let hotelAdmins = await fxn.getHotelAdmins(id);
		
		res.render('admin/hotel/show', {
			page: 'hotels',
			hotel: hotel,
			hotelAdmins: hotelAdmins,
			message: {
				status: req.flash('status'),
				message: req.flash('message')
			}
		});
	}catch(err){
		console.log(err);
	}
})

router.get('/hotels/:id/settings', isLoggedIn, async (req, res, next) => {
	let id = req.params.id;
	console.log('GET /hotels/' + id + '/settings');

	try{
		let hotel = await fxn.getHotelById(id);

		res.render('admin/hotel/setting', {
			page: 'hotels',
			hotel: hotel
		});
	}catch(err){
		console.log(err);
		res.status(5001);
	}
});

router.get('/hotels/new', isLoggedIn, async (req, res, next) => {
	res.render('admin/hotel/new', {
		page: 'hotels'
	});
});

router.post('/hotels/save', isLoggedIn, async (req, res, next) => {
	try{
		let newHotel = new Hotel;
		newHotel.name = req.body.name;
		newHotel.abrr = req.body.abrr
		newHotel.smart_g4_proxy_endpoint = req.body.endpoint;
		newHotel.client_id = uniqid();
		newHotel.save(function(err, hotel){
			if(err) res.status(500);

			req.flash('status', 'success');
			req.flash('message', 'New Hotel Successfully added.');

			res.json(hotel);
		});
		
	}catch(error){
		console.log('error', error);
		res.status(500);
	}
});

router.get('/hotel-admin/:id/new', isLoggedIn, async (req, res, next) => {
	let id = req.params.id;
	console.log('GET /hotel-admin/' + id + '/new');

	try{
		let hotel = await fxn.getHotelById(id);
		
		res.render('admin/hotel-admin/new', {
			page: 'hotels',
			hotel: hotel
		});
	}catch(err){
		console.log(err);
	}
});

router.post('/hotel-admin/save', isLoggedIn, async (req, res, next) => {
	console.log('POST /hotel-admin/save');

	let raw_password = generatePassword();

	bcrypt.hash(raw_password, 10, function(err, hash) {
		if (err) res(err)
		let newHotelAdmin = new HotelAdmin;
		newHotelAdmin.hotel = req.body.hotel;
		newHotelAdmin.name.first = req.body.first_name;
		newHotelAdmin.name.last = req.body.last_name;
		newHotelAdmin.email_address = req.body.email_address;
		newHotelAdmin.username = req.body.username;
		newHotelAdmin.password = hash;
		newHotelAdmin.save(function (err, hotelAdmin){
			if(err){
				console.log(err);
				res.status(500);
			}

			req.flash('status', 'success');
			req.flash('message', 'New Hotel Admin Successfully added.');

			res.json(raw_password);
		});
	});

});

/*
	USERS
*/

router.get('/users', isLoggedIn, async (req, res, next) => {
	console.log('GET /users');

	try{
		let users = await fxn.getUsers();
		for(let i = 0; i < users.length; i++){
			let room = await fxn.getRoomById(users[i].room_assign);
			users[i].room_raw = room;
			users[i].password = base32.decode(users[i].password);
		}

		res.render('admin/user/index', {
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
		let rooms = await fxn.getRooms();
		res.render('admin/user/new', {
			page: 'users',
			rooms: rooms
		});
	}catch(error){
		console.log(error)
		res.json({"error" : "Something went wrong"});
	}
});

router.get('/users/:id/setting', isLoggedIn, async (req, res) => {
	let id = req.params.id;

	console.log('GET /users/' + id + '/setting');

	try {
		let user = await fxn.getUserById(id);
		let rooms = await fxn.getRooms();
		res.render('admin/user/setting', {
			page: 'users',
			user: user,
			rooms: rooms
		});
	} catch(error){
		console.log(error);
	}
});

router.post('/users/save', isLoggedIn, function (req, res) {
	console.log('POST /users/save');

	try{
		let newUser = new User;
		newUser.username = req.body.username;
		newUser.password = base32.encode(req.body.password);
		newUser.room_assign = req.body.room;
		newUser.token = fxn.generateToken();
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

router.get('/rooms', isLoggedIn, async (req, res, next) => {
	console.log('GET /rooms');

	try{
		let roomsRaw = await fxn.getRooms();
	
		let rooms = new Array();

		for (let i = 0; i < roomsRaw.length; i++) {
			var children = await fxn.getRoomByParentLocation(roomsRaw[i].id);
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

		res.render('admin/room/index', {
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
		let devicesRaw = await fxn.getDevicesByRoomId(id);
		let devices = new Array();

		//console.log(devices);
		for (let i = 0; i < devicesRaw.length; i++){
			let nodes = await fxn.getNodeByDeviceId(devicesRaw[i].node_id);
			let g4modules = null;

			if(nodes){
				g4modules = await fxn.getG4ModuleByNodeId(nodes.g4module_id);
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



router.post('/login', passport.authenticate('local-login', {
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}), function(req, res){
	res.redirect('/hotels');
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
	console.log('PUT /users/' + id + '/change-password');

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

router.put('/hotels/:id/update', isLoggedIn, function (req, res){
	let id = req.params.id;
	console.log('PUT /hotels/' + id + '/update');

	Hotel.findById(id, function(err, hotel){
		if(err) res.status(500);

		hotel.name = req.body.name;
		hotel.smart_g4_proxy_endpoint = req.body.endpoint;
		hotel.status = req.body.status;
		hotel.updated_at = Date.now();
		hotel.save();
		req.flash('status', 'success');
		req.flash('message', 'Hotel Successfully Updated.');
		res.json({status: true});
	});
});

router.put('/hotels/:id/g/client-id', isLoggedIn, function (req, res){
	let id = req.params.id;
	console.log('PUT /hotels/' + id + '/g/client-id');

	var gid = uniqid();

	Hotel.findById(id, function(err, hotel){
		if(err) res.status(500);

		hotel.set({ 
			client_id: gid,
			updated_at: Date.now() 
		});
		hotel.save();
		req.flash('status', 'success');
		req.flash('message', 'Hotel Successfully Updated.');
		res.json(gid);
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

router.delete('/hotels/:id/delete', isLoggedIn, function (req, res) {
	let id = req.params.id;

	console.log('DELETE /hotels/' + id + '/delete');

	Hotel.deleteOne({'_id': id}, function(err) {
		if(err) res.status(500);
		res.status(200).json({status: true});
	});
});

// route middleware to make sure
function isLoggedIn(req, res, next) {

	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/sys/login');
}

module.exports = router;