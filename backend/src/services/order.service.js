const orderRepository = require("../repositories/order.repository");

const createOrUpdateOrder = async (customerId, orderData) => {
    return await orderRepository.createOrUpdateOrder(customerId, orderData);
};

const getOrderByOrderCode = async (orderCode) => {
    return await orderRepository.getOrderByOrderCode(orderCode);
};

const confirmOrder = async (orderCode, orderData, paymentMethod) => {
    return await orderRepository.confirmOrder(orderCode, orderData, paymentMethod);
};

module.exports = {
    createOrUpdateOrder,
    getOrderByOrderCode,
    confirmOrder
};