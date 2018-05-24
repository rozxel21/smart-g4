const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bcrypt = require('bcrypt');

const sysAdminScheme = new Schema({
	username: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	created_at: { type: Date, default: Date.now },
});

// checking if password is valid
sysAdminScheme.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('sys_admin', sysAdminScheme);