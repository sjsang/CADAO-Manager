import axiosClient from './axiosClient';

const orderApi = {
    getByCustomerId: (params = {}) => axiosClient.get(`/orders/me`, { params }),
    create: (orderData) => axiosClient.post('/orders', orderData),
    getByOrderCode: (orderCode) => axiosClient.get(`/orders/${orderCode}`),
    getVnpayUrl: (orderCode) => axiosClient.post('/orders/create-qr', { orderCode }),
    confirm: (orderCode, payload, paymentMethod) =>
        axiosClient.patch(`/orders/${orderCode}/status`, { ...payload, paymentMethod, status: "confirmed" }),
    cancel: (orderCode, refundInfo) => axiosClient.patch(`/orders/${orderCode}/status`, {
        status: "cancelled",
        refundInfo: refundInfo || undefined
    }),
    getAllOrders: (params = {}) => axiosClient.get('/orders', { params }),
    updateStatusByAdmin: (orderCode, status, note, shipperId) =>
        axiosClient.patch(`/orders/${orderCode}/admin-status`, { status, note, shipperId: shipperId || undefined }),
    submitReview: (orderCode, payload) => axiosClient.post(`/orders/${orderCode}/review`, payload),
    getShippers: () => axiosClient.get('/orders/shippers'),
    getMyDeliveries: () => axiosClient.get('/orders/my-deliveries'),
    getMyDeliveryHistory: () => axiosClient.get('/orders/my-deliveries/history'),
    completeDelivery: (orderCode) => axiosClient.patch(`/orders/${orderCode}/shipper-complete`),
    markTransferPaid: (orderCode) => axiosClient.patch(`/orders/${orderCode}/admin-payment`),
    markPaymentRefunded: (orderCode) => axiosClient.patch(`/orders/${orderCode}/admin-payment-refunded`),
    reorder: (orderCode) => axiosClient.post(`/orders/${orderCode}/reorder`)
};

export default orderApi;