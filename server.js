const express = require('express');
const app = express();

// db configuration
//const mongodb = require('./db/mongodb.js');

const controller = require('./controllers');

// View 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Controller
app.use(controller);



app.listen(3001, function() {
	console.log('Listening on port 3001...');
});