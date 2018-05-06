const express = require('express');
const app = express();

// db configuration
//const mongodb = require('./db/mongodb.js');

const controller = require('./controllers');
const googleConfig = require('./google-cloud/config-provider.js');

console.log(googleConfig);

// View 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Controller
app.use(controller);

// ayyBpLFzgiVrBCSNsIbRlZui2QpTLXyWayyBpLFzgiVrBCSNsIbRlZui2QpTLXyW

app.listen(3001, function() {
	console.log('Listening on port 3001...');
});