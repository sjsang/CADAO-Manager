const promotionService = require('../services/promotion.service');

const getPromotions = async (req, res) => {
    try {
        const promotions = await promotionService.getPromotions();
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ error: 'Failed to fetch promotions' });
    }
};

const getPromotionById = async (req, res) => {
    const { id } = req.params;
    try {
        const promotion = await promotionService.getPromotionById(id);
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        res.json(promotion);
    } catch (error) {
        console.error('Error fetching promotion by ID:', error);
        res.status(500).json({ error: 'Failed to fetch promotion' });
    }
};

const createPromotion = async (req, res) => {
    const promotionData = req.body;
    try {
        const newPromotion = await promotionService.createPromotion(promotionData);
        res.status(201).json(newPromotion);
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ error: 'Failed to create promotion' });
    }
};

module.exports = {
    getPromotions,
    getPromotionById,
    createPromotion
};