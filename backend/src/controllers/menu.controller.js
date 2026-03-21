const menuService = require("../services/menu.service");

const getMenuItems = async (req, res) => {
    try {
        const { type, category, search, sort, available } = req.query;

        const data = await menuService.getMenuItems(type, category, search, sort, available);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getMenuItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await menuService.getMenuItemById(id);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const createMenuItem = async (req, res) => {
    try {
        const { name, description, price, categoryId, isAvailable } = req.body;
        const imageFile = req.file;
        const data = await menuService.createMenuItem(name, description, price, categoryId, isAvailable, imageFile);
        res.status(201).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, categoryId, isAvailable } = req.body;
        const imageFile = req.file;
        const data = await menuService.updateMenuItem(id, name, description, price, categoryId, isAvailable, imageFile);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem
};