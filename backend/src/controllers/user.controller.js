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

const createUserByAdmin = async (req, res) => {
    try {
        const { username, password, full_name, phone_number, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập username, mật khẩu và vai trò"
            });
        }

        if (!['admin', 'staff', 'shipper'].includes(role)) {
            return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });
        }

        const user = await userService.createUserByAdmin({
            username: String(username).trim(),
            password: String(password),
            full_name: full_name ? String(full_name).trim() : null,
            phone_number: phone_number ? String(phone_number).trim() : null,
            role
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        if (error?.code === '23505') {
            return res.status(409).json({ success: false, message: 'Username đã tồn tại' });
        }
        console.error("Error creating user:", error);
        res.status(500).json({ success: false, message: "Failed to create user" });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [user, assignedOrders] = await Promise.all([
            userService.getUserById(id),
            userService.getAssignedOrders(id)
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            data: {
                ...user,
                assigned_orders: assignedOrders
            }
        });
    } catch (error) {
        console.error("Error fetching user detail:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.toggleUserStatus(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Error toggling user status:", error);
        res.status(500).json({ success: false, message: "Failed to toggle user status" });
    }
};

module.exports = {
    getUsers,
    createUserByAdmin,
    getUserById,
    toggleUserStatus
};