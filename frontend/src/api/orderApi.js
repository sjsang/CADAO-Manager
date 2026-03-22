import axiosClient from './axiosClient';

const orderApi = {
    getByCustomerId: () => axiosClient.get(`/orders/me`),
    create: (orderData) => axiosClient.post('/orders', orderData),
    getByOrderCode: (orderCode) => axiosClient.get(`/orders/${orderCode}`),
    confirm: (orderCode, payload, paymentMethod) =>
        axiosClient.patch(`/orders/${orderCode}/status`, { ...payload, paymentMethod, status: "confirmed" }),
    cancel: (orderCode) => axiosClient.patch(`/orders/${orderCode}/status`, { status: "cancelled" }),
    getAllOrders: (search) => axiosClient.get(`/orders?search=${encodeURIComponent(search)}`),
    updateStatusByAdmin: (orderCode, status, note, shipperId) =>
        axiosClient.patch(`/orders/${orderCode}/admin-status`, { status, note, shipperId: shipperId || undefined }),
    getShippers: () => axiosClient.get('/orders/shippers'),
    getMyDeliveries: () => axiosClient.get('/orders/my-deliveries'),
    completeDelivery: (orderCode) => axiosClient.patch(`/orders/${orderCode}/shipper-complete`)
};

export default orderApi;