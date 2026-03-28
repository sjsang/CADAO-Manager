const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const promotionController = require('../controllers/promotion.controller');

router.get('/', promotionController.getPromotions);
router.post('/', authenticate, requireRole('admin'), promotionController.createPromotion);
router.get('/:id', promotionController.getPromotionById);

module.exports = router;