const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const menuRepository = require("../repositories/menu.repository");

const getMenuItems = async (type, category) => {
    return await menuRepository.getMenuItems(type, category);
}

const getMenuItemById = async (id) => {
    return await menuRepository.getMenuItemById(id);
}

const createMenuItem = async (name, description, price, categoryId, imageFile) => {
    let imageUrl = null;

    if (imageFile) {
        const result = await cloudinary.uploader.upload(imageFile.path, {
            folder: "CADAO/menu",
        });
        imageUrl = result.public_id;
        fs.unlinkSync(imageFile.path);
    }

    return await menuRepository.createMenuItem(name, description, price, categoryId, imageUrl);
}

const updateMenuItem = async (id, name, description, price, categoryId, imageFile) => {
    let imageUrl = null;

    if (imageFile) {
        const result = await cloudinary.uploader.upload(imageFile.path, {
            folder: "CADAO/menu",
        });
        imageUrl = result.public_id;
        fs.unlinkSync(imageFile.path);
    }

    return await menuRepository.updateMenuItem(id, name, description, price, categoryId, imageUrl);
}

const deleteMenuItem = async (id) => {
    const menuItem = await menuRepository.getMenuItemById(id);

    if (!menuItem) {
        throw new Error("Menu item not found");
    }

    if (menuItem.image_url) {
        await cloudinary.uploader.destroy(menuItem.image_url);
    }

    return await menuRepository.deleteMenuItem(id);
}

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
};