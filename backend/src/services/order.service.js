const orderRepository = require("../repositories/order.repository");

const ADMIN_STATUS_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["shipping", "cancelled"],
    shipping: ["completed"],
    completed: [],
    cancelled: []
};

const getAllOrders = async (queryOptions) => {
    return await orderRepository.getAllOrders(queryOptions);
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

const submitOrderReview = async (orderCode, customerId, rating, content) => {
    const normalizedRating = Number(rating);
    const normalizedContent = typeof content === "string" ? content.trim() : "";

    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
        throw new Error("INVALID_RATING");
    }

    if (!normalizedContent) {
        throw new Error("INVALID_REVIEW_CONTENT");
    }

    return await orderRepository.submitOrderReview(orderCode, customerId, normalizedRating, normalizedContent);
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

const getShippers = async () => {
    return await orderRepository.getShippers();
};

const updateOrderStatusByAdmin = async (orderCode, nextStatus, changedBy, note, shipperId = null) => {
    if (!changedBy) {
        throw new Error("Không xác định được người cập nhật đơn hàng");
    }

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

    if (nextStatus === "shipping" && !shipperId) {
        throw new Error("Vui lòng chọn người giao hàng");
    }

    return await orderRepository.updateOrderStatus(orderCode, nextStatus, changedBy, resolvedNote, shipperId);
};

const getOrdersByShipperId = async (shipperId) => {
    return await orderRepository.getOrdersByShipperId(shipperId);
};

const getDeliveryHistoryByShipperId = async (shipperId) => {
    return await orderRepository.getDeliveryHistoryByShipperId(shipperId);
};

const completeDelivery = async (orderCode, shipperId) => {
    return await orderRepository.completeDelivery(orderCode, shipperId);
};

module.exports = {
    getAllOrders,
    getOrdersByCustomerId,
    createOrUpdateOrder,
    getOrderByOrderCode,
    submitOrderReview,
    confirmOrder,
    cancelOrder,
    updateOrderStatusByAdmin,
    getShippers,
    getOrdersByShipperId,
    getDeliveryHistoryByShipperId,
    completeDelivery
};