const getStatusText = (status) => {
    let statusText = '';
    switch (status) {
        case 'pending':
            statusText = 'Chờ xác nhận';
            break;
        case 'confirmed':
            statusText = 'Đã xác nhận';
            break;
        case 'preparing':
            statusText = 'Đang chuẩn bị';
            break;
        case 'shipping':
            statusText = 'Đang giao hàng';
            break;
        case 'completed':
            statusText = 'Đã hoàn thành';
            break;
        case 'cancelled':
            statusText = 'Đã hủy';
            break;
        default:
            statusText = status;
    }
    return statusText;
};

const getPaymentMethodText = (method) => {
    let methodText = '';
    switch (method) {
        case 'cash':
            methodText = 'Tiền mặt';
            break;
        case 'transfer':
            methodText = 'Chuyển khoản ngân hàng';
            break;
        default:
            methodText = method;
    }
    return methodText;
};

const getPaymentStatusText = (status) => {
    let statusText = '';
    switch (status) {
        case 'pending':
            statusText = 'Chờ thanh toán';
            break;
        case 'paid':
            statusText = 'Đã thanh toán';
            break;
        case 'failed':
            statusText = 'Thanh toán thất bại';
            break;
        case 'refunded':
            statusText = 'Đã hoàn tiền';
            break;
        default:
            statusText = status;
    }
    return statusText;
};

export { getStatusText, getPaymentMethodText, getPaymentStatusText };