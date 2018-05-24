const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const util = require('util')
const sql = require('../db/mysql-db.js');
const https = require('https');
const base32 = require('base-32').default;
const guid = require('uuid/v1');

const User = require('../models/user.js');
const AuthCode = require('../models/auth-code.js');

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json({type: 'application/json'}));

router.get('/oauth', function (req, res){
	console.log(req.query);
	let client_id = req.query.client_id;
    let redirect_uri = req.query.redirect_uri;
    let state = req.query.state;
    let response_type = req.query.response_type;
    let authCode = req.query.code;

    res.redirect(util.format('/auth/login?client_id=%s&redirect_uri=%s&redirect=%s&state=%s',
        client_id, encodeURIComponent(redirect_uri), req.path, state));
});

router.get('/login', function (req, res){
	console.log("GET /auth/login");
	console.log(req.query);

	res.render('login', {
		queryString: req.query
	});
});

router.post('/login', async (req, res, next) => {
	console.log(req.body);
	try{
		let user = await AuthenticateUser(req.body.username, base32.encode(req.body.password));
		console.log(user);
		if(!user){
			res.json({status: false, message: 'Incorrect username/password'});
		}else{
			//console.log(req.session);
			let authCode = generateAuthCode(user.id, req.body.client);
			res.json({status: true, authCode: authCode});
		}
		
	}catch(error){
		console.log(error);
	}
});

router.all('/token', async (req, res, next) => {
	console.log('/token!');

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
	let authCode = guid();
	
	let newAuthCode = new AuthCode;
	newAuthCode.authcode = authCode;
	newAuthCode.user_id = user_id;
	newAuthCode.client_id = client_id; 
	newAuthCode.save();

	return authCode;
};

/*
	Promises Fxn
*/

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

module.exports = router;