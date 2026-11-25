const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');
const { requireVerifiedEmail } = require('../middleware/firebaseAuth');
const findFarmerForUser = require('../utils/findFarmerForUser');

// POST /api/farmer → save farmer profile
router.post('/', async (req, res) => {
  try {
    const { uid, name, email, phone } = req.body;
    const profileName = typeof name === 'string' ? name.trim() : '';
    const profileEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const profilePhone = typeof phone === 'string' ? phone.trim() : '';

    if (!profileName || !profileEmail || !profilePhone) {
      return res.status(400).json({ message: 'name, email and phone are required' });
    }
    if (uid !== req.firebaseUser.uid) {
      return res.status(403).json({ message: 'The profile UID must match the signed-in user' });
    }
    if (profileEmail !== req.firebaseUser.email?.trim().toLowerCase()) {
      return res.status(403).json({ message: 'The profile email must match the signed-in user' });
    }

    const existingBuyer = await Buyer.findOne({ uid });
    if (existingBuyer) {
      return res.status(409).json({
        message: 'This Firebase account is already registered as a Buyer'
      });
    }

    const farmer = await Farmer.create({
      uid,
      name: profileName,
      email: req.firebaseUser.email.trim().toLowerCase(),
      phone: profilePhone
    });
    res.status(201).json(farmer);
  } catch (err) {
    console.error('Farmer profile creation failed:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Farmer already registered' });
    }
    res.status(500).json({ message: 'Unable to create farmer profile' });
  }
});

// GET /api/farmer/me → get the signed-in farmer profile
router.get('/me', requireVerifiedEmail, async (req, res) => {
  try {
    const farmer = await findFarmerForUser(req.firebaseUser);
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found' });
    res.json(farmer);
  } catch (err) {
    console.error('Farmer profile retrieval failed:', err.message);
    res.status(500).json({ message: 'Unable to retrieve farmer profile' });
  }
});

const updateFarmerProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const profileName = typeof name === 'string' ? name.trim() : '';
    const profilePhone = typeof phone === 'string' ? phone.trim() : '';
    if (!profileName || !profilePhone) {
      return res.status(400).json({ message: 'name and phone are required' });
    }

    const existingFarmer = await findFarmerForUser(req.firebaseUser);
    if (!existingFarmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    const farmer = await Farmer.findOneAndUpdate(
      { _id: existingFarmer._id },
      {
        $set: {
          name: profileName,
          phone: profilePhone,
          email: req.firebaseUser.email
        }
      },
      { new: true, runValidators: true }
    );

    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found' });
    res.json(farmer);
  } catch (err) {
    console.error('Farmer profile update failed:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email is already in use' });
    }
    res.status(500).json({ message: 'Unable to update farmer profile' });
  }
};

// Keep /me available while the frontend uses its authenticated UID route.
router.put('/me', requireVerifiedEmail, updateFarmerProfile);
router.put('/:uid', requireVerifiedEmail, (req, res) => {
  if (req.params.uid !== req.firebaseUser.uid) {
    return res.status(403).json({ message: 'You can only update your own profile' });
  }
  return updateFarmerProfile(req, res);
});

// GET /api/farmer/:uid → get the signed-in farmer profile by UID
router.get('/:uid', async (req, res) => {
  try {
    if (req.params.uid !== req.firebaseUser.uid) {
      return res.status(403).json({ message: 'You can only view your own profile' });
    }
    if (!req.firebaseUser.email_verified) {
      return res.status(403).json({ message: 'A verified email is required' });
    }

    const farmer = await findFarmerForUser(req.firebaseUser);
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found' });
    res.json(farmer);
  } catch (err) {
    console.error('Farmer profile retrieval failed:', err.message);
    res.status(500).json({ message: 'Unable to retrieve farmer profile' });
  }
});

module.exports = router;