const orderService = require("../services/order.service");

const createOrUpdateOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const orderData = req.body;
        const result = await orderService.createOrUpdateOrder(customerId, orderData);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
};

const getOrderByOrderCode = async (req, res) => {
    try {
        const orderCode = req.params.orderCode;
        const result = await orderService.getOrderByOrderCode(orderCode);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ success: false, message: "Failed to fetch order" });
    }
};

const confirmOrder = async (req, res) => {
    try {
        const orderCode = req.params.orderCode;
        const orderData = req.body;
        const paymentMethod = req.body.paymentMethod;
        const result = await orderService.confirmOrder(orderCode, orderData, paymentMethod);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error confirming order:", error);
        res.status(500).json({ success: false, message: "Failed to confirm order" });
    }
};

module.exports = {
    createOrUpdateOrder,
    getOrderByOrderCode,
    confirmOrder
};