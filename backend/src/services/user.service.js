const userRepository = require("../repositories/user.repository");
const bcrypt = require("bcrypt");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const getUsers = async (queryOptions) => {
    return await userRepository.getUsers(queryOptions);
};

const createUserByAdmin = async (userData) => {
    const password_hash = await bcrypt.hash(userData.password, 10);
    return await userRepository.createUserByAdmin({
        ...userData,
        password_hash
    });
};

const getUserById = async (id) => {
    return await userRepository.getUserById(id);
};

const getMyProfile = async (id) => {
    return await userRepository.getMyProfile(id);
};

const toggleUserStatus = async (id) => {
    return await userRepository.toggleUserStatus(id);
};

const updateUser = async (id, { full_name, phone_number, role, password }) => {
    if (!['admin', 'shipper'].includes(role)) {
        throw new Error('INVALID_ROLE');
    }

    let password_hash = null;
    if (password && String(password).length > 0) {
        if (String(password).length < 6) {
            throw new Error('PASSWORD_TOO_SHORT');
        }
        password_hash = await bcrypt.hash(String(password), 10);
    }

    return await userRepository.updateUser(id, {
        full_name: full_name ? String(full_name).trim() : null,
        phone_number: phone_number ? String(phone_number).trim() : null,
        role,
        password_hash
    });
};

const updateMyProfile = async (id, { full_name, phone_number, password }) => {
    let password_hash = null;
    if (password && String(password).length > 0) {
        if (String(password).length < 6) {
            throw new Error('PASSWORD_TOO_SHORT');
        }
        password_hash = await bcrypt.hash(String(password), 10);
    }

    return await userRepository.updateMyProfile(id, {
        full_name: full_name ? String(full_name).trim() : null,
        phone_number: phone_number ? String(phone_number).trim() : null,
        password_hash
    });
};

const updateMyAvatar = async (id, avatarFile) => {
    if (!avatarFile) {
        throw new Error("AVATAR_FILE_REQUIRED");
    }

    const uploadResult = await cloudinary.uploader.upload(avatarFile.path, {
        folder: "CADAO/avatars/users",
        resource_type: "image"
    });

    fs.unlinkSync(avatarFile.path);

    return await userRepository.updateMyAvatar(id, uploadResult.public_id);
};

const getAssignedOrders = async (userId) => {
    return await userRepository.getAssignedOrders(userId);
};

module.exports = {
    getUsers,
    createUserByAdmin,
    getUserById,
    toggleUserStatus,
    updateUser,
    getMyProfile,
    getAssignedOrders,
    updateMyProfile,
    updateMyAvatar,
};