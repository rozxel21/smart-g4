const mysql = require('mysql');

const connection = mysql.createConnection({
	host: '210.16.15.44',
	user: 'read',
	password: 'smartg4',
	database : 'g4_development'
});

module.exports = connection;