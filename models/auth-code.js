const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const authCodeScheme = new Schema({
	authcode: { type: String, required: true, index: { unique: true } },
	type: { type: String, required: true, default: 'AUTH_CODE' },
	user_id: { type: String, required: true },
	client_id: { type: String, required: true },
	created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('auth_code', authCodeScheme);

