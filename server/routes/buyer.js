const express = require('express');
const mongoose = require('mongoose');
const Buyer = require('../models/Buyer');
const Farmer = require('../models/Farmer');
const Product = require('../models/Product');
const { requireVerifiedEmail } = require('../middleware/firebaseAuth');
const findBuyerForUser = require('../utils/findBuyerForUser');

const router = express.Router();
const declarationVersion = 'genuine-buyer-v1';

const requireBuyerProfile = async (req, res, next) => {
  try {
    const buyer = await findBuyerForUser(req.firebaseUser);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer profile not found' });
    }

    req.buyer = buyer;
    next();
  } catch (error) {
    console.error('Buyer profile lookup failed:', error.message);
    res.status(500).json({ message: 'Unable to retrieve Buyer profile' });
  }
};

const publicProduct = (product) => ({
  _id: product._id,
  productName: product.productName,
  quantity: product.quantity,
  quantityUnit: product.quantityUnit,
  location: product.location,
  village: product.village,
  town: product.town,
  district: product.district,
  state: product.state,
  country: product.country,
  pincode: product.pincode,
  price: product.price,
  priceUnit: product.priceUnit,
  totalPrice: product.totalPrice,
  createdAt: product.createdAt
});

router.post('/', async (req, res) => {
  const { uid } = req.body || {};
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';
  const signedInEmail = req.firebaseUser.email?.trim().toLowerCase();

  if (!name || !phone || !email) {
    return res.status(400).json({ message: 'name, email and phone are required' });
  }
  if (req.body?.genuineBuyerConfirmed !== true) {
    return res.status(400).json({
      message: 'You must confirm that you are a genuine buyer before registering'
    });
  }
  if (uid !== req.firebaseUser.uid) {
    return res.status(403).json({ message: 'The profile UID must match the signed-in user' });
  }
  if (email !== signedInEmail) {
    return res.status(403).json({ message: 'The profile email must match the signed-in user' });
  }

  try {
    const existingFarmer = await Farmer.findOne({ uid: req.firebaseUser.uid });
    if (existingFarmer) {
      return res.status(409).json({
        message: 'This Firebase account is already registered as a Farmer. Buyer registration requires a separate Firebase account.'
      });
    }

    const buyer = await Buyer.create({
      uid: req.firebaseUser.uid,
      name,
      email: signedInEmail,
      phone,
      genuineBuyerConfirmed: true,
      genuineBuyerConfirmedAt: new Date(),
      genuineBuyerDeclarationVersion: declarationVersion
    });
    res.status(201).json(buyer);
  } catch (error) {
    console.error('Buyer profile creation failed:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A Buyer account already exists for this email' });
    }
    res.status(500).json({ message: 'Unable to save the Buyer profile to MongoDB' });
  }
});

router.get('/me', requireVerifiedEmail, requireBuyerProfile, (req, res) => {
  res.json(req.buyer);
});

router.put('/me', requireVerifiedEmail, requireBuyerProfile, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const email = req.firebaseUser.email?.trim().toLowerCase();

  if (!name || !phone || !email) {
    return res.status(400).json({ message: 'name, email and phone are required' });
  }

  try {
    const buyer = await Buyer.findOneAndUpdate(
      { _id: req.buyer._id },
      { $set: { name, phone, email } },
      { new: true, runValidators: true }
    );
    if (!buyer) return res.status(404).json({ message: 'Buyer profile not found' });
    res.json(buyer);
  } catch (error) {
    console.error('Buyer profile update failed:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email is already in use' });
    }
    res.status(500).json({ message: 'Unable to update Buyer profile' });
  }
});

router.get('/products', requireVerifiedEmail, requireBuyerProfile, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products.map(publicProduct));
  } catch (error) {
    console.error('Buyer product catalogue retrieval failed:', error.message);
    res.status(500).json({ message: 'Unable to retrieve available products' });
  }
});

router.get(
  '/products/:productId',
  requireVerifiedEmail,
  requireBuyerProfile,
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    try {
      const product = await Product.findById(req.params.productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const farmer = await Farmer.findOne({ uid: product.farmerUid }) ||
        await Farmer.findOne({ email: product.farmerEmail });
      if (!farmer) {
        return res.status(404).json({
          message: 'Farmer contact details are unavailable for this listing'
        });
      }

      res.json({
        ...publicProduct(product),
        farmer: { name: farmer.name, phone: farmer.phone }
      });
    } catch (error) {
      console.error('Buyer product detail retrieval failed:', error.message);
      res.status(500).json({ message: 'Unable to retrieve product details' });
    }
  }
);

module.exports = router;
