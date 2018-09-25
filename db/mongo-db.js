const mongoose = require('mongoose');
//mongoose.connect('mongodb://admin:jumpman305@localhost/smart_g4_db');
mongoose.connect('mongodb://localhost:27017/smart_g4_db');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Database Connected..");
});

module.exports = mongoose;