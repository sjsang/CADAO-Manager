const orderService = require("../services/order.service");

const getAllOrders = async (req, res) => {
    try {
        const search = req.query.search || "";
        const result = await orderService.getAllOrders(search);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

const getOrdersByCustomerId = async (req, res) => {
    try {
        const customerId = req.user.id;
        const result = await orderService.getOrdersByCustomerId(customerId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

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

const cancelOrder = async (req, res) => {
    try {
        const orderCode = req.params.orderCode;
        const result = await orderService.cancelOrder(orderCode);
        if (result) {
            res.status(200).json({ success: true, data: { orderId: result } });
        } else {
            res.status(400).json({ success: false, message: "Failed to cancel order. Order may not be pending." });
        }
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Failed to cancel order" });
    }
};


module.exports = {
    getAllOrders,
    getOrdersByCustomerId,
    createOrUpdateOrder,
    getOrderByOrderCode,
    confirmOrder,
    cancelOrder
};