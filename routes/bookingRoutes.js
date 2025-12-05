// src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import CommonJS
const bookingController = require('../controllers/bookingController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ Routes
// verifyToken
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/', bookingController.getAllBookings);
router.get('/:refCode',bookingController.getBookingByReference)
// router.get('/:id', bookingController.getBookingById);
router.put('/:refCode/status', bookingController.updateStatus);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.cancelBooking);

// Routes Admin spécifiques
router.put('/:id/confirm', bookingController.confirmBooking);
router.put('/:id/complete',  bookingController.completeBooking);

module.exports = router;
