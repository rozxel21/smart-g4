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

module.exports = router;