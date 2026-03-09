const categoryRepository = require('../repositories/category.repository');

const getCategories = async (type) => {
    return await categoryRepository.getCategories(type);
};

module.exports = {
    getCategories
};