const promotionRepository = require('../repositories/promotion.repository');

const getPromotions = async () => {
    return await promotionRepository.getPromotions();
};

const getPromotionById = async (id) => {
    return await promotionRepository.getPromotionById(id);
};

const createPromotion = async (promotionData) => {
    return await promotionRepository.createPromotion(promotionData);
};

module.exports = {
    getPromotions,
    getPromotionById,
    createPromotion
};