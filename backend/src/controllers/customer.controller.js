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

// Address Management
const getAddresses = async (req, res) => {
    try {
        const customerId = req.user.id;
        const addresses = await customerService.getCustomerAddresses(customerId);
        res.status(200).json({ success: true, data: addresses });
    }
    catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ success: false, message: "Failed to fetch addresses" });
    }
};

const addAddress = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { addressLine, wardId } = req.body;

        if (!addressLine || !wardId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const address = await customerService.addCustomerAddress(customerId, addressLine, wardId);
        res.status(201).json({ success: true, data: address });
    }
    catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ success: false, message: "Failed to add address" });
    }
};

const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { addressLine, wardId } = req.body;

        if (!addressLine || !wardId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const address = await customerService.updateCustomerAddress(id, addressLine, wardId);
        res.status(200).json({ success: true, data: address });
    }
    catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ success: false, message: "Failed to update address" });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        await customerService.deleteCustomerAddress(id);
        res.status(200).json({ success: true, message: "Address deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ success: false, message: "Failed to delete address" });
    }
};

const setDefaultAddress = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { addressId } = req.body;

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Address ID is required" });
        }

        const address = await customerService.setDefaultAddress(customerId, addressId);
        res.status(200).json({ success: true, data: address });
    }
    catch (error) {
        console.error("Error setting default address:", error);
        res.status(500).json({ success: false, message: "Failed to set default address" });
    }
};

module.exports = {
    getCustomers,
    updateCustomer,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};