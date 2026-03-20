const customerService = require('../services/customer.service');

const getCustomers = async (req, res) => {
    try {
        const data = await customerService.getCustomers();
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ success: false, message: "Failed to fetch customers" });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const id = req.user.id;
        const { name, email, phone } = req.body;
        const data = await customerService.updateCustomer(id, name, email, phone);
        res.json(data);
    }
    catch (error) {
        console.error("Error updating customer:", error);
        res.status(500).json({ error: "An error occurred while updating the customer." });
    }
};

module.exports = {
    getCustomers,
    updateCustomer
};