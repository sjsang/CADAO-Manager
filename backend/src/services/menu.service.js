const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const menuRepository = require("../repositories/menu.repository");

const parseBoolean = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") {
            return true;
        }
        if (normalized === "false") {
            return false;
        }
    }

    return null;
};

const getMenuItems = async ({ type, category, search, sort, available, page, limit }) => {
    const availableFilter = parseBoolean(available);
    return await menuRepository.getMenuItems({
        type,
        category,
        search,
        sort,
        available: availableFilter,
        page,
        limit
    });
}

const getMenuItemById = async (id) => {
    return await menuRepository.getMenuItemById(id);
}

const createMenuItem = async (name, description, price, categoryId, isAvailable, imageFile) => {
    let imageUrl = null;
    const availableValue = parseBoolean(isAvailable);

    if (imageFile) {
        const result = await cloudinary.uploader.upload(imageFile.path, {
            folder: "CADAO/menu",
        });
        imageUrl = result.public_id;
        fs.unlinkSync(imageFile.path);
    }

    return await menuRepository.createMenuItem(name, description, price, categoryId, imageUrl, availableValue);
}

const updateMenuItem = async (id, name, description, price, categoryId, isAvailable, imageFile) => {
    let imageUrl = null;
    const availableValue = parseBoolean(isAvailable);

    if (imageFile) {
        const result = await cloudinary.uploader.upload(imageFile.path, {
            folder: "CADAO/menu",
        });
        imageUrl = result.public_id;
        fs.unlinkSync(imageFile.path);
    }

    return await menuRepository.updateMenuItem(id, name, description, price, categoryId, imageUrl, availableValue);
}

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem
};