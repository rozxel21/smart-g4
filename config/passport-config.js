const express = require('express');
const app = express();

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const flash    = require('connect-flash');
const SysAdmin = require('../models/sys-admin.js');


app.use(session({ secret: 'ilovegunsnroses', cookie: { maxAge: 86400000 } })); // session secret; expired 1 day
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
 
passport.deserializeUser(function(id, done) {
  SysAdmin.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use('local-login', new LocalStrategy({
	usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true
},
function (req, username, password, done){
	SysAdmin.findOne({'username': username}, function (err, user){
		if(err) done(err);

		if (!user){
			return done(null, false, req.flash('loginMessage', 'No user found.'));
		}

		if (!user.validPassword(password)){
        	return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
		}

        return done(null, user);
	});
}));

module.exports = app;