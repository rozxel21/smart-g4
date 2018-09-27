const express = require('express');
const app = express();

const mongodb = require('./db/mongo-db');
const controller = require('./controllers');
const auth = require('./controllers/auth');
const smartG4 = require('./smart-g4');
const passport = require('./config/passport-config');

const guid = require('uuid/v1');
const bodyParser = require('body-parser');

/*const fs = require('fs');
const http = require('http');
const https = require('https');


var options = {
    key: fs.readFileSync('./privatekey.pem'),
    cert: fs.readFileSync('./certificate.pem')
};
*/

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({type: 'application/json'}));

app.use(passport);

// View 
var engine = require('ejs-layout');
app.set('view engine', 'ejs');
app.engine('ejs', engine.__express);

app.use(express.static(__dirname + '/public'));

// Controller
app.use(controller); // main
app.use('/auth', auth);	// google oauth
app.use('/smart-g4', smartG4); // google home endpoint 

/*const testApi = require('./test-api');
app.use('/test-api', testApi);

  app.use(function(req, res) {
      res.status(400);
     res.render('404');
  });*/

/*https.createServer(options, app).listen(3001, function(){
  console.log("Express server listening on port " + 3001);
});*/

app.listen(3001, function() {
	console.log('Listening on port 3001...');
});