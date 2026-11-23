const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');

// POST /api/farmer → save farmer profile
router.post('/', async (req, res) => {
  try {
    console.log('📥 Incoming farmer:', req.body);
    const { uid, name, email, phone } = req.body;

    if (!uid || !name || !email || !phone) {
      return res.status(400).json({ message: 'uid, name, email and phone are required' });
    }

    const farmer = await Farmer.create({ uid, name, email, phone });
    console.log('✅ Farmer saved:', farmer.email);
    res.status(201).json(farmer);
  } catch (err) {
    console.error('❌ Save failed:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Farmer already registered' });
    }
    res.status(500).json({ message: err.message });
  }
});

// GET /api/farmer/:uid → get farmer profile (for dashboard)
router.get('/:uid', async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ uid: req.params.uid });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;