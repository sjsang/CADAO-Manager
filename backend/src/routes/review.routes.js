const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');

router.get('/admin', authenticate, requireRole('admin'), reviewController.getReviewsForAdmin);

// Public endpoint – no auth required
router.get('/', reviewController.getRecentReviews);

module.exports = router;
