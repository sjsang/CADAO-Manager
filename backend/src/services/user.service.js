const userRepository = require("../repositories/user.repository");

const getUsers = async () => {
    return await userRepository.getUsers();
};

module.exports = {
    getUsers
};