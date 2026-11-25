const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmerUid: { type: String, required: true, index: true },
  farmerEmail: { type: String, required: true, lowercase: true, index: true },
  productName: {
    type: String,
    required: true,
    enum: ['Mosambi', 'Banana', 'Chilli', 'Brinjal']
  },
  quantity: { type: Number, required: true, min: 0.01 },
  quantityUnit: { type: String, required: true, enum: ['kg', 'quintal', 'tonne'] },
  location: { type: String, required: true, trim: true },
  village: { type: String, required: true, trim: true },
  town: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0.01 },
  priceUnit: { type: String, required: true, enum: ['kg', 'tonne'] },
  totalPrice: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
