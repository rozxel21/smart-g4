const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const https = require('https');

router.get('/', function (req, res){

});

router.get('/users', function (req, res){
	res.render('admin/user',{
		page: 'Users'
	});
});

router.get('/login', function (req, res){
	res.render('login');
});

module.exports = router;