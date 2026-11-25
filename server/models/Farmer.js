const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase user ID
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  location: String,
  produce: String
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);