const userRepository = require("../repositories/user.repository");
const bcrypt = require("bcrypt");

const getUsers = async () => {
    return await userRepository.getUsers();
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

const toggleUserStatus = async (id) => {
    return await userRepository.toggleUserStatus(id);
};

const getAssignedOrders = async (userId) => {
    return await userRepository.getAssignedOrders(userId);
};

module.exports = {
    getUsers,
    createUserByAdmin,
    getUserById,
    toggleUserStatus,
    getAssignedOrders
};