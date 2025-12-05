const express = require('express');
const router = express.Router();
const { getAdvancedAnalytics } = require('../controllers/analyticsController');
// const { authenticate } = require('../middlewares/authMiddleware');

router.get('/advanced', getAdvancedAnalytics);

module.exports = router;
