const orderRepository = require("../repositories/order.repository");

const ADMIN_STATUS_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["shipping", "cancelled"],
    shipping: ["completed"],
    completed: [],
    cancelled: []
};

const getAllOrders = async (search) => {
    return await orderRepository.getAllOrders(search);
};

const getOrdersByCustomerId = async (customerId) => {
    return await orderRepository.getOrdersByCustomerId(customerId);
};

const createOrUpdateOrder = async (customerId, orderData) => {
    return await orderRepository.createOrUpdateOrder(customerId, orderData);
};

const getOrderByOrderCode = async (orderCode) => {
    return await orderRepository.getOrderByOrderCode(orderCode);
};

const confirmOrder = async (orderCode, orderData, paymentMethod) => {
    return await orderRepository.confirmOrder(orderCode, orderData, paymentMethod);
};

const cancelOrder = async (orderCode) => {
    const order = await orderRepository.getOrderByOrderCode(orderCode);
    if (order.status !== 'pending') {
        throw new Error("Only pending orders can be cancelled");
    } else {
        return await orderRepository.cancelOrder(orderCode);
    }
};

const updateOrderStatusByAdmin = async (orderCode, nextStatus, changedBy, note) => {
    const order = await orderRepository.getOrderByOrderCode(orderCode);

    if (!order) {
        throw new Error("Order not found");
    }

    const currentStatus = order.status;
    const allowedStatuses = ADMIN_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedStatuses.includes(nextStatus)) {
        throw new Error(`Cannot update order from ${currentStatus} to ${nextStatus}`);
    }

    const resolvedNote = nextStatus === "cancelled" && typeof note === "string"
        ? note.trim()
        : null;

    if (nextStatus === "cancelled" && !resolvedNote) {
        throw new Error("Cancel reason is required");
    }

    return await orderRepository.updateOrderStatus(orderCode, nextStatus, changedBy, resolvedNote);
};

module.exports = {
    getAllOrders,
    getOrdersByCustomerId,
    createOrUpdateOrder,
    getOrderByOrderCode,
    confirmOrder,
    cancelOrder,
    updateOrderStatusByAdmin
};