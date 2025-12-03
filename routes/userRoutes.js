// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import CommonJS
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ Routes Admin Only
router.get('/', verifyToken, requireRole(['admin']), userController.getAllUsers);
router.delete('/:id', verifyToken, requireRole(['admin']), userController.deleteUser);
router.put('/:id/role', verifyToken, requireRole(['admin']), userController.updateUserRole);

// ✅ Routes Utilisateur / Admin
router.get('/:id', verifyToken, userController.getUserById);
router.put('/:id', verifyToken, userController.updateUser);
router.get('/:id/bookings', verifyToken, userController.getUserBookings);
router.get('/:id/reviews', verifyToken, userController.getUserReviews);

module.exports = router;
