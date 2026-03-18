import axiosClient from './axiosClient';

const orderApi = {
    getByCustomerId: () => axiosClient.get(`/orders`),
    create: (orderData) => axiosClient.post('/orders', orderData),
    getByOrderCode: (orderCode) => axiosClient.get(`/orders/${orderCode}`),
    confirm: (orderCode, payload, paymentMethod) =>
        axiosClient.post(`/orders/${orderCode}/confirm`, { ...payload, paymentMethod }),
    cancel: (orderCode) => axiosClient.post(`/orders/${orderCode}/cancel`)
};

export default orderApi;