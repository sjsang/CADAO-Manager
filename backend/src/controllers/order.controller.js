const orderService = require("../services/order.service");

const getAllOrders = async (req, res) => {
    try {
        const queryOptions = {
            search: String(req.query.search || "").trim(),
            status: String(req.query.status || "all").trim(),
            sortBy: String(req.query.sortBy || "created_at").trim(),
            sortDir: String(req.query.sortDir || "desc").trim(),
            page: Number(req.query.page || 1),
            limit: Number(req.query.limit || 5)
        };
        const result = await orderService.getAllOrders(queryOptions);
        res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
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
        if (error.message === "DEFAULT_ADDRESS_REQUIRED") {
            return res.status(400).json({
                success: false,
                message: "Vui long thiet lap dia chi mac dinh truoc khi thanh toan"
            });
        }
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

const submitOrderReview = async (req, res) => {
    try {
        const orderCode = req.params.orderCode;
        const customerId = req.user.id;
        const { rating, content } = req.body;

        const result = await orderService.submitOrderReview(orderCode, customerId, rating, content);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error submitting order review:", error);

        const errorMap = {
            INVALID_RATING: { status: 400, message: "Số sao phải từ 1 đến 5." },
            INVALID_REVIEW_CONTENT: { status: 400, message: "Nội dung đánh giá không được để trống." },
            ORDER_NOT_FOUND_OR_FORBIDDEN: { status: 404, message: "Không tìm thấy đơn hàng của bạn." },
            ORDER_NOT_COMPLETED: { status: 400, message: "Chỉ có thể đánh giá khi đơn hàng đã hoàn thành." }
        };

        const mapped = errorMap[error.message];
        if (mapped) {
            return res.status(mapped.status).json({ success: false, message: mapped.message });
        }

        res.status(500).json({ success: false, message: "Không thể gửi đánh giá." });
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
        const errorMap = {
            ORDER_NOT_IN_CART: { status: 400, message: "Đơn hàng đã được xác nhận hoặc không còn ở trạng thái giỏ hàng." },
            VOUCHER_NOT_FOUND: { status: 404, message: "Voucher không tồn tại." },
            VOUCHER_INACTIVE: { status: 400, message: "Voucher hiện không hoạt động." },
            VOUCHER_EXPIRED: { status: 400, message: "Voucher đã hết hạn." },
            VOUCHER_USAGE_LIMIT_REACHED: { status: 400, message: "Voucher đã hết lượt sử dụng." },
            VOUCHER_MIN_ORDER_NOT_MET: { status: 400, message: "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng voucher." },
            INVALID_PAYMENT_METHOD: { status: 400, message: "Phương thức thanh toán không hợp lệ." },
            "Order not found": { status: 404, message: "Không tìm thấy đơn hàng." }
        };

        const mapped = errorMap[error.message];

        if (mapped) {
            return res.status(mapped.status).json({ success: false, message: mapped.message });
        }

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

const updateOrderStatus = async (req, res) => {
    const { status, ...payload } = req.body;

    if (status === "confirmed") {
        req.body = payload;
        return confirmOrder(req, res);
    }

    if (status === "cancelled") {
        return cancelOrder(req, res);
    }

    return res.status(400).json({ success: false, message: "Unsupported status" });
};

const updateOrderStatusByAdmin = async (req, res) => {
    try {
        const orderCode = req.params.orderCode;
        const { status, note, shipperId } = req.body;
        const changedBy = req.user?.id || null;

        const result = await orderService.updateOrderStatusByAdmin(orderCode, status, changedBy, note, shipperId || null);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error updating order status by admin:", error);
        res.status(400).json({ success: false, message: error.message || "Failed to update order status" });
    }
};

const getShippers = async (req, res) => {
    try {
        const shippers = await orderService.getShippers();
        res.status(200).json({ success: true, data: shippers });
    } catch (error) {
        console.error("Error fetching shippers:", error);
        res.status(500).json({ success: false, message: "Failed to fetch shippers" });
    }
};

const getMyDeliveries = async (req, res) => {
    try {
        const shipperId = req.user.id;
        const result = await orderService.getOrdersByShipperId(shipperId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching shipper deliveries:", error);
        res.status(500).json({ success: false, message: "Failed to fetch deliveries" });
    }
};

const getMyDeliveryHistory = async (req, res) => {
    try {
        const shipperId = req.user.id;
        const result = await orderService.getDeliveryHistoryByShipperId(shipperId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching shipper delivery history:", error);
        res.status(500).json({ success: false, message: "Failed to fetch delivery history" });
    }
};

const completeDelivery = async (req, res) => {
    try {
        const orderCode = req.params.orderCode;
        const shipperId = req.user.id;
        const result = await orderService.completeDelivery(orderCode, shipperId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error completing delivery:", error);
        const status = error.message === 'ORDER_NOT_FOUND' ? 404
            : error.message === 'NOT_ASSIGNED' ? 403
                : 400;
        const msg = error.message === 'ORDER_NOT_FOUND' ? 'Không tìm thấy đơn hàng'
            : error.message === 'NOT_ASSIGNED' ? 'Bạn không được phân công đơn này'
                : 'Không thể cập nhật trạng thái';
        res.status(status).json({ success: false, message: msg });
    }
};

module.exports = {
    getAllOrders,
    getOrdersByCustomerId,
    createOrUpdateOrder,
    getOrderByOrderCode,
    submitOrderReview,
    updateOrderStatus,
    updateOrderStatusByAdmin,
    getShippers,
    getMyDeliveries,
    getMyDeliveryHistory,
    completeDelivery
};