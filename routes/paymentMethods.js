const express = require('express');
const router = express.Router();
const { authMiddleware, isPDG } = require('../middleware/auth');
const {
  getPaymentMethodStats,
  getPaymentMethodDetails,
  getPaymentMethodTrends
} = require('../controllers/paymentMethodController');

/**
 * @route   GET /api/v1/payment-methods
 * @desc    Récupérer les statistiques des méthodes de paiement
 * @access  Private (PDG only)
 * @query   startDate, endDate, siteId (optional)
 */
router.get('/', getPaymentMethodStats);

/**
 * @route   GET /api/v1/payment-methods/trends
 * @desc    Récupérer les tendances mensuelles des méthodes de paiement
 * @access  Private (PDG only)
 * @query   year (optional)
 */
router.get('/trends', getPaymentMethodTrends);

/**
 * @route   GET /api/v1/payment-methods/:method
 * @desc    Récupérer les détails d'une méthode de paiement
 * @access  Private (PDG only)
 * @query   startDate, endDate, siteId (optional)
 */
router.get('/:method',getPaymentMethodDetails);

module.exports = router;
