// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import CommonJS
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Si vous avez un fichier de validation, importez-le aussi en CommonJS
// Si `validateRating` n'existe pas, créez-le ou supprimez l'import
// const { validateRating } = require('../utils/validators');
// Pour l'instant, une fonction simple pour éviter l'erreur :
const validateRating = (rating) => rating >= 1 && rating <= 5;


// ✅ Routes
router.get('/', reviewController.getReviews);

router.post('/', async (req, res, next) => {
  try {
    const { rating } = req.body;
    console.log(rating);
    if (!rating || !validateRating(rating)) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }
    await reviewController.createReview(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', reviewController.getReviewById);

router.put('/:id', async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (rating && !validateRating(rating)) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }
    await reviewController.updateReview(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', reviewController.deleteReview);

// Routes Admin
router.put('/:id/approve', verifyToken, requireRole(['admin']), reviewController.approveReview);
router.put('/:id/reject', verifyToken, requireRole(['admin']), reviewController.rejectReview);

router.get('/site/:siteId/stats', reviewController.getReviewStats);

module.exports = router;
