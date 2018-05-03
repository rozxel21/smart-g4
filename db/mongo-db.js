const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/smart_g4_db');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Database Connected..");
});

module.exports = mongoose;