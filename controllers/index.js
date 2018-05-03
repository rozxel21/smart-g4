const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const https = require('https');

router.get('/', function (req, res){
	https.get('https://210.16.1.75:3443/', (response) => {
		console.log(response.status);

		response.on('data', (d) => {
			res.json(d);
		});
	}).on('error', (e) => {
		console.log(e);
	});
});

router.get('/login', function (req, res){
	res.render('login');
});

module.exports = router;