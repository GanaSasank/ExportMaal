const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const { requireFirebaseAuth } = require('./middleware/firebaseAuth');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ Mongo error:', err));

// Routes
const farmerRoutes = require('./routes/farmer');
app.use('/api/farmer', requireFirebaseAuth, farmerRoutes);

const buyerRoutes = require('./routes/buyer');
app.use('/api/buyer', requireFirebaseAuth, buyerRoutes);

const productRoutes = require('./routes/product');
app.use('/api/products', requireFirebaseAuth, productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
