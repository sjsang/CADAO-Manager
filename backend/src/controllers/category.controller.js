const categoryService = require('../services/category.service');

const getCategories = async (req, res) => {
    try {
        const { type } = req.query;
        const data = await categoryService.getCategories(type);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getCategories
};