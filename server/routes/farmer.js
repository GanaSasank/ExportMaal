const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');

// Register Farmer
router.post('/register', async (req, res) => {
  try {
    const newFarmer = new Farmer(req.body);
    await newFarmer.save();
    res.status(201).json({ message: 'Farmer registered successfully' });
  } catch (err) {
    console.error('❌ Error saving farmer:', err);
    res.status(500).json({ error: 'Failed to register farmer' });
  }
});

module.exports = router;
