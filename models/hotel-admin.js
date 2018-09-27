const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelAdminSchema = new Schema({
	name: {
		first: { type: String, required: true },
		last: { type: String, required: true } },
	email_address: { type: String, required: true, index: { unique: true } },
	username: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	hotel: { type: Schema.ObjectId, required: true },
	status: { type: Boolean, default: true },
	created_at: { type: Date, default: Date.now },
	updated_at: Date
});

module.exports = mongoose.model('hotel_admin', hotelAdminSchema);