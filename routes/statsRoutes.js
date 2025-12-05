// src/routes/statsRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import CommonJS
const statsController = require('../controllers/statsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ Routes Publiques
router.get('/dashboard', statsController.getDashboardStats);

// ✅ Routes Privées (Général)
router.get('/summary', statsController.getStatsSummary);

// ✅ Routes Admin / Manager
router.get('/sites', verifyToken, requireRole(['admin', 'manager']), statsController.getSiteStats);

// ✅ Routes Admin Only
router.get('/users', statsController.getUserStats);
router.get('/bookings', statsController.getBookingStats);
router.get('/revenue', statsController.getRevenueStats);
router.get('/reviews', statsController.getReviewStats);
router.get('/pdgdashoard', statsController.getPdgDashboardStat);
// router.get('/getGlobalOccupancy', statsController.getGlobalOccupancyStats);
module.exports = router;
