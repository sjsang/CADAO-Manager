const promotionRepository = require('../repositories/promotion.repository');

const getPromotions = async () => {
    return await promotionRepository.getPromotions();
};

const getPromotionById = async (id) => {
    return await promotionRepository.getPromotionByIdFull(id);
};

const createPromotion = async (promotionData) => {
    return await promotionRepository.createPromotion(promotionData);
};

const updatePromotion = async (id, promotionData) => {
    return await promotionRepository.updatePromotion(id, promotionData);
};

const deletePromotion = async (id) => {
    return await promotionRepository.deletePromotion(id);
};

const togglePromotion = async (id) => {
    return await promotionRepository.togglePromotion(id);
};

const getActivePromotionsForItems = async (menuItemIds) => {
    return await promotionRepository.getActivePromotionsForItems(menuItemIds);
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