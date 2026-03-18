const menuTypeService = require("../services/menu_type.service");

const getMenuTypes = async (req, res) => {
    try {
        const data = await menuTypeService.getMenuTypes();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getMenuTypes
};