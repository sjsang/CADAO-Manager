const promotionService = require('../services/promotion.service');
const notificationService = require('../services/notification.service');

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

        // Gửi thông báo cho tất cả khách hàng
        notificationService.notifyAllNewPromotion(promotionData.name).catch(err =>
            console.error('Failed to notify customers about new promotion:', err)
        );

        res.status(201).json(newPromotion);
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ error: 'Failed to create promotion' });
    }
};

const updatePromotion = async (req, res) => {
    const { id } = req.params;
    const promotionData = req.body;
    try {
        const result = await promotionService.updatePromotion(id, promotionData);
        res.json(result);
    } catch (error) {
        if (error.message === 'PROMOTION_NOT_FOUND') {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        console.error('Error updating promotion:', error);
        res.status(500).json({ error: 'Failed to update promotion' });
    }
};

const deletePromotion = async (req, res) => {
    const { id } = req.params;
    try {
        await promotionService.deletePromotion(id);
        res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        if (error.message === 'PROMOTION_NOT_FOUND') {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        console.error('Error deleting promotion:', error);
        res.status(500).json({ error: 'Failed to delete promotion' });
    }
};

const togglePromotion = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await promotionService.togglePromotion(id);
        res.json(result);
    } catch (error) {
        if (error.message === 'PROMOTION_NOT_FOUND') {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        console.error('Error toggling promotion:', error);
        res.status(500).json({ error: 'Failed to toggle promotion' });
    }
};

const getActivePromotionsForItems = async (req, res) => {
    try {
        const { menu_item_ids } = req.body;
        if (!Array.isArray(menu_item_ids) || menu_item_ids.length === 0) {
            return res.json([]);
        }
        const promotions = await promotionService.getActivePromotionsForItems(menu_item_ids);
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching active promotions for items:', error);
        res.status(500).json({ error: 'Failed to fetch active promotions' });
    }
};

module.exports = {
    getPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion,
    getActivePromotionsForItems
};