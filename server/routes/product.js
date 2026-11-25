const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { requireVerifiedEmail } = require('../middleware/firebaseAuth');
const findFarmerForUser = require('../utils/findFarmerForUser');
const {
  calculateTotalPrice,
  quantityUnitKg,
  priceUnitKg
} = require('../utils/productPricing');

const router = express.Router();
const productNames = ['Mosambi', 'Banana', 'Chilli', 'Brinjal'];
const textFields = ['location', 'village', 'town', 'district', 'state', 'country', 'pincode'];

const validateProduct = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Product details are required';
  }
  const quantity = Number(body.quantity);
  const price = Number(body.price);
  if (!productNames.includes(body.productName)) return 'Select a valid product';
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Quantity must be greater than zero';
  if (!Object.prototype.hasOwnProperty.call(quantityUnitKg, body.quantityUnit)) {
    return 'Select a valid quantity unit';
  }
  if (!Number.isFinite(price) || price <= 0) return 'Price must be greater than zero';
  if (!Object.prototype.hasOwnProperty.call(priceUnitKg, body.priceUnit)) {
    return 'Select a valid price unit';
  }
  const totalPrice = calculateTotalPrice({
    quantity,
    quantityUnit: body.quantityUnit,
    price,
    priceUnit: body.priceUnit
  });
  if (!Number.isFinite(totalPrice)) return 'The calculated total is too large';
  for (const field of textFields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `${field} is required`;
    }
  }
  return null;
};

const getProductValues = (body, firebaseUser) => ({
  farmerUid: firebaseUser.uid,
  farmerEmail: firebaseUser.email.trim().toLowerCase(),
  productName: body.productName,
  quantity: Number(body.quantity),
  quantityUnit: body.quantityUnit,
  location: body.location.trim(),
  village: body.village.trim(),
  town: body.town.trim(),
  district: body.district.trim(),
  state: body.state.trim(),
  country: body.country.trim(),
  pincode: body.pincode.trim(),
  price: Number(body.price),
  priceUnit: body.priceUnit,
  totalPrice: calculateTotalPrice({
    quantity: Number(body.quantity),
    quantityUnit: body.quantityUnit,
    price: Number(body.price),
    priceUnit: body.priceUnit
  })
});

router.use(requireVerifiedEmail);
router.use(async (req, res, next) => {
  try {
    const farmer = await findFarmerForUser(req.firebaseUser);
    if (!farmer) {
      return res.status(403).json({ message: 'A saved farmer profile is required' });
    }
    req.farmer = farmer;
    next();
  } catch (error) {
    console.error('Farmer identity lookup failed for products:', error.message);
    res.status(500).json({ message: 'Unable to verify farmer profile' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const products = await Product.find({
      $or: [
        { farmerUid: req.firebaseUser.uid },
        { farmerEmail: req.firebaseUser.email.trim().toLowerCase() }
      ]
    }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Farmer products retrieval failed:', error.message);
    res.status(500).json({ message: 'Unable to retrieve farmer products' });
  }
});

router.post('/', async (req, res) => {
  const validationError = validateProduct(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const product = await Product.create(
      getProductValues(req.body, req.firebaseUser)
    );
    res.status(201).json(product);
  } catch (error) {
    console.error('Farmer product creation failed:', error.message);
    res.status(500).json({ message: 'Unable to create product' });
  }
});

router.put('/:productId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  const validationError = validateProduct(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.productId,
        $or: [
          { farmerUid: req.firebaseUser.uid },
          { farmerEmail: req.firebaseUser.email.trim().toLowerCase() }
        ]
      },
      { $set: getProductValues(req.body, req.firebaseUser) },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Farmer product update failed:', error.message);
    res.status(500).json({ message: 'Unable to update product' });
  }
});

router.delete('/:productId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.productId,
      $or: [
        { farmerUid: req.firebaseUser.uid },
        { farmerEmail: req.firebaseUser.email.trim().toLowerCase() }
      ]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(204).end();
  } catch (error) {
    console.error('Farmer product deletion failed:', error.message);
    res.status(500).json({ message: 'Unable to delete product' });
  }
});

module.exports = router;
