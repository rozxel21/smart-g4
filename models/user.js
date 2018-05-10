const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	username: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	description: String,
	room_assign: Number,
	room_raw: Array,
	token: { type: Array, required: true },
	status: { type: Boolean, default: true },
	created_at: { type: Date, default: Date.now },
	updated_at: Date,
});

module.exports = mongoose.model('user', userSchema);

