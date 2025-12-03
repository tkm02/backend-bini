// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import des sous-fichiers de routes (qui doivent être en CommonJS aussi)
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const siteRoutes = require('./siteRoutes');
const reviewRoutes = require('./reviewRoutes');
const bookingRoutes = require('./bookingRoutes');
const statsRoutes = require('./statsRoutes');

// Montage des routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sites', siteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/bookings', bookingRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
