const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bcrypt = require('bcrypt');

const hotelScheme = new Schema({
	name: { type: String, required: true },
	abrr: { type: String, required: true, index: { unique: true } },
	smart_g4_proxy_endpoint: { type: String, required: true },
	client_id: { type: String, index: { unique: true } },
	status: { type: Boolean, default: true },
	created_at: { type: Date, default: Date.now },
	updated_at: Date
});

module.exports = mongoose.model('hotel', hotelScheme);