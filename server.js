const express = require('express');
const app = express();

const mongodb = require('./db/mongo-db.js');
const controller = require('./controllers');
const auth = require('./controllers/auth.js');
const session = require('express-session');

app.use(session({
	genid: function (req) {
		return Math.floor(Math.random() * 10000000000000000000000000000000000000000).toString(36);
	},
	secret: 'jumpman23',
	resave: false,
	saveUninitialized: true,
	cookie: {secure: false}
}));

// View 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Controller
app.use(controller);
app.use('/sauth', auth);

app.listen(3001, function() {
	console.log('Listening on port 3001...');
});