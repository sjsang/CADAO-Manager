const userService = require("../services/user.service");

const getUsers = async (req, res) => {
    try {
        const result = await userService.getUsers();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

module.exports = {
    getUsers
};