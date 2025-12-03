// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import correct en CommonJS
const authController = require('../controllers/authController');

// ✅ Définition des routes
// On vérifie bien qu'on appelle la FONCTION (authController.register)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Routes protégées (nécessitent un middleware d'authentification si vous en avez un)
// Exemple : router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/me', authController.getCurrentUser);
router.put('/password', authController.changePassword);

module.exports = router;
