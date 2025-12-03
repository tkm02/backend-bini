// src/routes/siteRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import CommonJS
const siteController = require('../controllers/siteController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ Routes Publiques
router.get('/', siteController.getAllSites);
router.get('/top', siteController.getTopSites);
router.get('/:id', siteController.getSiteById);
router.get('/:id/reviews', siteController.getSiteReviews);

// ✅ Routes Privées (Manager / Admin)
router.post('/', verifyToken, requireRole(['manager', 'admin']), siteController.createSite);
router.put('/:id', verifyToken, requireRole(['manager', 'admin']), siteController.updateSite);
router.delete('/:id', verifyToken, requireRole(['manager', 'admin']), siteController.deleteSite);

// ✅ Routes Spécifiques
router.get('/:id/bookings', verifyToken, requireRole(['manager', 'admin']), siteController.getSiteBookings);
router.post('/:id/upload', verifyToken, requireRole(['manager', 'admin']), siteController.uploadSiteImage);

module.exports = router;
