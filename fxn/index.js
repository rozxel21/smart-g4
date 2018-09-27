const sql = require('../db/mysql-db');
const guid = require('uuid/v1');

const User = require('../models/user');
const Hotel = require('../models/hotel');
const HotelAdmin = require('../models/hotel-admin');

exports.greeting = function(){
    console.log("Hey, how are you!");
}

exports.getHotels = function(){
	return new Promise((resolve, reject) => {
		Hotel.find(function(err, res){
			if(err) reject(error);
			resolve(res);
		}).sort('-created_at');
	});
}

exports.getHotelById = function(id){
	return new Promise((resolve, reject) => {
		Hotel.findById(id , function(err, res){
			if(err) reject("hotel not found");
			resolve(res);
		});
	});
}

exports.getHotelAdmins = function(id){
	return new Promise((resolve, reject) => {
		HotelAdmin.find({hotel: id} , function(err, res){
			if(err) reject("hotel admin not found");
			resolve(res);
		});
	});	
}

exports.getUsers = function(){
	return new Promise((resolve, reject) => {
		User.find(function(err, res){
			if(err) reject(error);
			resolve(res);
		}).sort('-created_at');
	});
};

exports.getUserById = function(id){
	return new Promise((resolve, reject) => {
		User.findById(id, function(err, res){
			if(err) reject(err);
			resolve(res);
		});
	});
}

exports.generateToken = function (){
	return {
		access_token: guid(),
		refresh_token: guid()
	};
}

exports.getRoomById = function(id){
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM locations WHERE id = ?";
		sql.query(query, [id], function (error, results, fields) {
		  if (error) reject(error);
		  resolve(results);
		});
	});
};

exports.getRooms = function(){
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

exports.getRoomByParentLocation = function(id){
	return new Promise((resolve, reject) => {
		let query = "SELECT * FROM locations WHERE parent_location = ?";
		sql.query(query, [id], function (error, results, fields) {
		  if (error) throw(error);
		  resolve(results);
		});
	});
};


exports.getUserByAccessToken = function(access_token){
	return new Promise((resolve, reject) => {
		User.findOne({ 'token.access_token': access_token }, function(err, res){
			if(err) reject("user not found!");
			resolve(res)
		});
	});
}

exports.getDevicesByRoomId = function(roomId){
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM locations WHERE parent_location = ?';

		sql.query(query, [roomId], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results);
		});
	});
}

exports.getNodeByDeviceId = function(id){
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM nodes WHERE id = ?';

		sql.query(query, [id], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results[0]);
		});
	});
}

exports.getG4ModuleByNodeId = function(id){
	return new Promise((resolve, reject) => {
		let query = 'SELECT * FROM g4modules WHERE id = ?';

		sql.query(query, [id], function (error, results, fields) {
			if (error) reject(error);
	  		 resolve(results[0]);
		});
	});
}