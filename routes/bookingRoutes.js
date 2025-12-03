// src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import CommonJS
const bookingController = require('../controllers/bookingController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ Routes
router.post('/', verifyToken, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);
router.get('/', verifyToken, requireRole(['admin', 'manager']), bookingController.getAllBookings);
router.get('/:id', verifyToken, bookingController.getBookingById);
router.put('/:id', verifyToken, bookingController.updateBooking);
router.delete('/:id', verifyToken, bookingController.cancelBooking);

// Routes Admin spécifiques
router.put('/:id/confirm', verifyToken, requireRole(['admin']), bookingController.confirmBooking);
router.put('/:id/complete', verifyToken, requireRole(['admin']), bookingController.completeBooking);

module.exports = router;
