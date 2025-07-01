const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');

// POST /api/farmers
router.post('/', async (req, res) => {
  try {
    const { fullName, phone, email } = req.body;

    // Basic validation
    if (!fullName || !phone || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newFarmer = new Farmer({ fullName, phone, email });
    await newFarmer.save();

    res.status(201).json({ message: '✅ Farmer registered successfully' });
  } catch (err) {
    console.error('❌ Error saving farmer:', err);
    res.status(500).json({ error: 'Failed to register farmer' });
  }
});

module.exports = router;
