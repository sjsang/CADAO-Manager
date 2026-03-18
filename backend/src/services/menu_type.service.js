const menu_typeRepository = require("../repositories/menu_type.repository");

const getMenuTypes = async () => {
    return await menu_typeRepository.getMenuTypes();
};

module.exports = {
    getMenuTypes
};