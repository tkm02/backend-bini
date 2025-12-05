// src/routes/siteRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// ✅ Import CommonJS
const siteController = require('../controllers/siteController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ Routes Publiques
// router.get('/', siteController.getAllSites);
router.get('/', siteController.getAllSitesNoPagination);
router.get('/top', siteController.getTopSites);
router.get('/:id', siteController.getSiteById);
router.get('/:id/reviews', siteController.getSiteReviews);

// ✅ Routes Privées (Manager / Admin)
// requireRole(['manager', 'admin'])
// verifyToken
router.post('/', upload.array('images', 10),siteController.createSite);
router.put('/:id', siteController.updateSite);
router.delete('/:id', verifyToken, requireRole(['manager', 'admin']), siteController.deleteSite);
router.get('/:id/occupancy',  siteController.getSiteOccupancy);

// ✅ Routes Spécifiques
router.get('/:id/bookings', verifyToken, requireRole(['manager', 'admin']), siteController.getSiteBookings);
router.post('/:id/upload', verifyToken, requireRole(['manager', 'admin']), siteController.uploadSiteImage);

module.exports = router;
