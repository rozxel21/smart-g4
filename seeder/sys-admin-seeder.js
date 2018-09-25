const SysAdmin = require('../models/sys-admin');
const bcrypt = require('bcrypt');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/smart_g4_db');

bcrypt.hash('projectJarvis', 10, function(err, hash) {
	if (err) reject(err)
	let newSysAdmin = new SysAdmin;
	newSysAdmin.username = "admin";
	newSysAdmin.password = hash;
	newSysAdmin.save(function(err, res){
		mongoose.disconnect();
	});
});