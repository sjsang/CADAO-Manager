import axiosClient from './axiosClient';

const orderApi = {
    create: (orderData) => axiosClient.post('/orders', orderData),
    getByOrderCode: (orderCode) => axiosClient.get(`/orders/${orderCode}`),
    confirm: (orderCode, payload, paymentMethod) =>
        axiosClient.post(`/orders/${orderCode}/confirm`, { ...payload, paymentMethod })
};

export default orderApi;