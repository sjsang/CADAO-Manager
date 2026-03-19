const orderRepository = require("../repositories/order.repository");

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

module.exports = {
    getAllOrders,
    getOrdersByCustomerId,
    createOrUpdateOrder,
    getOrderByOrderCode,
    confirmOrder,
    cancelOrder
};