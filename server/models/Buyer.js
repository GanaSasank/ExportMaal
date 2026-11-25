const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  genuineBuyerConfirmed: {
    type: Boolean,
    required: true,
    validate: {
      validator: (value) => value === true,
      message: 'Buyer declaration must be accepted'
    }
  },
  genuineBuyerConfirmedAt: { type: Date, required: true },
  genuineBuyerDeclarationVersion: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Buyer', buyerSchema);
