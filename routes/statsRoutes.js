// src/routes/statsRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import CommonJS
const statsController = require('../controllers/statsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ Routes Publiques
router.get('/dashboard', statsController.getDashboardStats);

// ✅ Routes Privées (Général)
router.get('/summary', verifyToken, statsController.getStatsSummary);

// ✅ Routes Admin / Manager
router.get('/sites', verifyToken, requireRole(['admin', 'manager']), statsController.getSiteStats);

// ✅ Routes Admin Only
router.get('/users', verifyToken, requireRole(['admin']), statsController.getUserStats);
router.get('/bookings', verifyToken, requireRole(['admin']), statsController.getBookingStats);
router.get('/revenue', verifyToken, requireRole(['admin']), statsController.getRevenueStats);
router.get('/reviews', verifyToken, requireRole(['admin']), statsController.getReviewStats);

module.exports = router;
