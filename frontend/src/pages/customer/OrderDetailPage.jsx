import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AOS from "aos";
import { getStatusText, getPaymentMethodText, getPaymentStatusText } from "../../functions/formatOrderFields";

import orderApi from "../../api/orderApi";
import Header from "../../components/customer/Header";
import CustomerConfirmModal from "../../components/customer/CustomerConfirmModal";
import { notifyCustomer } from "../../utils/customerNotify";
import { useSocket } from "../../contexts/SocketContext";

const OrderDetailPage = () => {
    const { orderCode } = useParams();
    const socket = useSocket();
    const [order, setOrder] = useState(null);
    const [itemRatings, setItemRatings] = useState({});
    const [reviewContent, setReviewContent] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [isRefundFormOpen, setIsRefundFormOpen] = useState(false);
    const [isCancellingOrder, setIsCancellingOrder] = useState(false);
    const [isRetryingVnpay, setIsRetryingVnpay] = useState(false);
    const [refundForm, setRefundForm] = useState({
        bankName: "",
        accountNumber: "",
        accountName: "",
        note: ""
    });

    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                const response = await orderApi.getByOrderCode(orderCode);
                const fetchedOrder = response.data.data;
                setOrder(fetchedOrder);

                if (fetchedOrder?.review) {
                    const ratingMap = {};
                    (fetchedOrder.review.items || []).forEach((item) => {
                        ratingMap[item.menu_item_id] = Number(item.rating) || 5;
                    });
                    setItemRatings(ratingMap);
                    setReviewContent(fetchedOrder.review.content || "");
                } else if (Array.isArray(fetchedOrder?.items)) {
                    const defaultRatings = {};
                    fetchedOrder.items.forEach((item) => {
                        defaultRatings[item.menu_item_id] = 5;
                    });
                    setItemRatings(defaultRatings);
                    setReviewContent("");
                }
                AOS.refresh();
            } catch (error) {
                console.error("Failed to fetch order detail:", error);
            }
        };

        fetchOrderDetail();
    }, [orderCode]);

    // Real-time order status update via socket
    useEffect(() => {
        if (!socket || !orderCode) return;

        const handleStatusUpdate = (data) => {
            if (data.orderCode === orderCode) {
                // Re-fetch full order detail
                orderApi.getByOrderCode(orderCode)
                    .then((res) => setOrder(res.data.data))
                    .catch(() => { });
            }
        };

        socket.on("order:statusUpdated", handleStatusUpdate);
        return () => socket.off("order:statusUpdated", handleStatusUpdate);
    }, [socket, orderCode]);

    const isRefundInfoRequired =
        (order?.payment?.method === "vnpay" || order?.payment?.method === "transfer") &&
        order?.payment?.payment_status === "paid";

    const handleCancelOrder = () => {
        if (isRefundInfoRequired) {
            setIsRefundFormOpen(true);
            return;
        }

        setIsCancelConfirmOpen(true);
    };

    const handleCancelOrderConfirmed = async () => {
        setIsCancellingOrder(true);
        try {
            const refundInfoPayload = isRefundInfoRequired
                ? {
                    bankName: refundForm.bankName.trim(),
                    accountNumber: refundForm.accountNumber.trim(),
                    accountName: refundForm.accountName.trim(),
                    note: refundForm.note.trim()
                }
                : undefined;

            await orderApi.cancel(orderCode, refundInfoPayload);
            const latest = await orderApi.getByOrderCode(orderCode);
            setOrder(latest.data?.data || null);

            if (isRefundInfoRequired) {
                notifyCustomer({ message: "Đã hủy đơn hàng và gửi thông tin hoàn tiền cho admin.", type: "success" });
            } else {
                notifyCustomer({ message: "Đã hủy đơn hàng.", type: "success" });
            }
        } catch (error) {
            console.error("Failed to cancel order:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Không thể hủy đơn hàng.",
                type: "error"
            });
        } finally {
            setIsCancellingOrder(false);
            setIsCancelConfirmOpen(false);
            setIsRefundFormOpen(false);
        }
    };

    const handleRefundInputChange = (field, value) => {
        setRefundForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleOpenRefundConfirm = () => {
        if (!refundForm.bankName.trim() || !refundForm.accountNumber.trim() || !refundForm.accountName.trim()) {
            notifyCustomer({ message: "Vui lòng nhập đầy đủ thông tin nhận hoàn tiền.", type: "warning" });
            return;
        }

        setIsRefundFormOpen(false);
        setIsCancelConfirmOpen(true);
    };

    const handleRetryVnpay = async () => {
        setIsRetryingVnpay(true);
        try {
            const res = await orderApi.getVnpayUrl(orderCode);
            const paymentUrl = typeof res.data === "string"
                ? res.data
                : res.data?.paymentUrl || res.data?.url || res.data?.data?.paymentUrl;
            if (!paymentUrl) throw new Error("VNPAY_URL_NOT_FOUND");
            notifyCustomer({ message: "Đang chuyển hướng đến cổng thanh toán VNPay...", type: "info" });
            window.location.href = paymentUrl;
        } catch (error) {
            console.error("Failed to get VNPay URL:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Không thể tạo liên kết thanh toán VNPay.",
                type: "error"
            });
            setIsRetryingVnpay(false);
        }
    };

    const handleSetItemRating = (menuItemId, rating) => {
        setItemRatings((prev) => ({
            ...prev,
            [menuItemId]: rating
        }));
    };

    const computeAverageItemRating = (ratingsMap, items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return 0;
        }

        const sum = items.reduce((acc, item) => acc + Number(ratingsMap[item.menu_item_id] || 0), 0);
        return sum / items.length;
    };

    const handleSubmitReview = async () => {
        if (submittingReview) {
            return;
        }

        if (!reviewContent.trim()) {
            notifyCustomer({ message: "Vui lòng nhập nội dung đánh giá.", type: "warning" });
            return;
        }

        if (!Array.isArray(order?.items) || order.items.length === 0) {
            notifyCustomer({ message: "Không tìm thấy món ăn để đánh giá.", type: "warning" });
            return;
        }

        const missingRating = order.items.some((item) => !Number.isInteger(Number(itemRatings[item.menu_item_id])));
        if (missingRating) {
            notifyCustomer({ message: "Vui lòng chấm sao cho từng món trong đơn.", type: "warning" });
            return;
        }

        const payloadItemRatings = order.items.map((item) => ({
            menuItemId: item.menu_item_id,
            rating: Number(itemRatings[item.menu_item_id])
        }));

        try {
            setSubmittingReview(true);
            const response = await orderApi.submitReview(orderCode, {
                content: reviewContent.trim(),
                itemRatings: payloadItemRatings
            });

            const createdReview = response.data?.data;
            const averageRating = computeAverageItemRating(itemRatings, order.items);

            setOrder((prev) => ({
                ...prev,
                review: createdReview || {
                    rating: Number(averageRating.toFixed(2)),
                    content: reviewContent.trim(),
                    items: payloadItemRatings.map((row) => {
                        const matchedItem = prev?.items?.find((i) => i.menu_item_id === row.menuItemId);
                        return {
                            menu_item_id: row.menuItemId,
                            rating: row.rating,
                            menu_item_name: matchedItem?.name || ""
                        };
                    })
                }
            }));

            notifyCustomer({ message: "Đã gửi đánh giá thành công!", type: "success" });
        } catch (error) {
            console.error("Failed to submit review:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Không thể gửi đánh giá.",
                type: "error"
            });
        } finally {
            setSubmittingReview(false);
        }
    };


    return (
        <>
            <div>
                <Header />

                <div className="w-7xl mx-auto py-10 text-white">
                    <div data-aos="fade-up" className="text-center mb-12">
                        <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Chi tiết đơn hàng</p>
                        <h1 className="text-5xl font-bold mb-5">Theo dõi đơn hàng</h1>
                        <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                    </div>

                    {order ? (
                        <div className="space-y-8">
                            <div data-aos="fade-up" className="bg-black/30 border border-white/10 rounded-xl p-8">
                                <div className="grid lg:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Mã đơn hàng</p>
                                        <p className="text-2xl font-bold text-[#e4c590] font-mono">{order.order_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Trạng thái</p>
                                        <p className={`text-2xl font-bold ${order.status === "completed" ? "text-green-400" :
                                            order.status === "cancelled" ? "text-red-400" :
                                                order.status === "pending" ? "text-yellow-400" :
                                                    "text-blue-400"
                                            }`}>
                                            {getStatusText(order.status)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Phương thức TT</p>
                                        <p className="text-lg text-gray-300">{getPaymentMethodText(order.payment?.method)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Trạng thái TT</p>
                                        <p className={`text-lg font-semibold ${order.payment?.payment_status === "paid" ? "text-green-400" : "text-yellow-400"
                                            }`}>
                                            {getPaymentStatusText(order.payment?.payment_status)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div data-aos="fade-up" data-aos-delay="100" className="bg-black/30 border border-white/10 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-[#e4c590] mb-6 uppercase tracking-widest">Thông tin giao hàng</h3>
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Người nhận</p>
                                        <p className="text-lg text-white font-semibold">{order.delivery_full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Số điện thoại</p>
                                        <p className="text-lg text-white font-semibold">{order.delivery_phone}</p>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Địa chỉ</p>
                                        <p className="text-lg text-white">{order.delivery_address}, {order.delivery_ward_name}</p>
                                    </div>
                                    {order.notes && (
                                        <div className="lg:col-span-2">
                                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Ghi chú</p>
                                            <p className="text-white italic text-opacity-80">{order.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div data-aos="fade-up" data-aos-delay="150" className="bg-black/30 border border-white/10 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-[#e4c590] mb-6 uppercase tracking-widest">Chi tiết thanh toán</h3>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Tạm tính ({order.items.length} món)</span>
                                        <span>{Number(order.subtotal || 0).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>Phí vận chuyển</span>
                                        <span className="text-[#e4c590]">{Number(order.shipping_fee).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    {Number(order.discount_amount) > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span>Giảm giá{order.voucher_code ? <span className="ml-2 text-xs font-mono bg-green-900/40 border border-green-500/30 rounded px-2 py-0.5 text-green-300">Voucher: {order.voucher_code}</span> : null}</span>
                                            <span>-{Number(order.discount_amount).toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-white/10 pt-3 text-2xl font-bold">
                                        <span>Tổng cộng</span>
                                        <span className="text-[#e4c590]">{Number(order.total_amount).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-[#e4c590] font-semibold uppercase tracking-wider">Tên</th>
                                                <th className="text-center py-3 px-4 text-[#e4c590] font-semibold uppercase tracking-wider">SL</th>
                                                <th className="text-right py-3 px-4 text-[#e4c590] font-semibold uppercase tracking-wider">Giá</th>
                                                <th className="text-right py-3 px-4 text-[#e4c590] font-semibold uppercase tracking-wider">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {order.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <span className="text-gray-300">{item.name}</span>
                                                        {item.promotion && (
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <span className="text-xs bg-amber-900/30 border border-amber-500/30 rounded px-1.5 py-0.5 text-amber-300">
                                                                    <i className="fa-solid fa-tag mr-1 text-[10px]" />
                                                                    {item.promotion.promotion_name}
                                                                    {item.promotion.discount_percent > 0 ? ` (-${item.promotion.discount_percent}%)` : ''}
                                                                </span>
                                                                {Number(item.promotion.discount_amount) > 0 && (
                                                                    <span className="text-xs text-green-400">-{Number(item.promotion.discount_amount).toLocaleString('vi-VN')}đ</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-gray-300">{item.quantity}</td>
                                                    <td className="py-3 px-4 text-right text-gray-400 text-sm">{Number(item.price).toLocaleString('vi-VN')}đ</td>
                                                    <td className="py-3 px-4 text-right text-[#e4c590] font-semibold">{Number(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {(order.status === "pending" || order.status === "confirmed") && (
                                <div data-aos="fade-up" data-aos-delay="200" className="space-y-4">
                                    {order.payment?.method === "transfer" && order.payment?.payment_status === "pending" && (
                                        <div className="bg-black/30 border border-white/10 rounded-xl p-8">
                                            <h3 className="text-xl font-bold text-[#e4c590] mb-6 uppercase tracking-widest">Thanh toán chuyển khoản</h3>
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="bg-white rounded-xl p-4">
                                                    <img
                                                        src={`https://img.vietqr.io/image/970423-0706348339-qr_only.png?amount=${Math.round(Number(order.total_amount))}&addInfo=${encodeURIComponent(order.order_code)}&accountName=NGUYEN%20THANH%20SANG`}
                                                        alt="QR chuyển khoản ngân hàng"
                                                        className="w-56 h-auto rounded-lg"
                                                    />
                                                </div>
                                                <div className="w-full space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Ngân hàng</span>
                                                        <span className="text-white font-semibold">TPBank</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Số tài khoản</span>
                                                        <span className="text-white font-semibold font-mono">0706348339</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Chủ tài khoản</span>
                                                        <span className="text-white font-semibold">NGUYEN THANH SANG</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Số tiền</span>
                                                        <span className="text-[#e4c590] font-bold text-base">{Number(order.total_amount).toLocaleString('vi-VN')}đ</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Nội dung CK</span>
                                                        <span className="text-white font-semibold font-mono">{order.order_code}</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
                                                    Vui lòng chuyển khoản đúng số tiền và ghi đúng nội dung. Đơn hàng sẽ được xử lý sau khi admin xác nhận thanh toán.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {order.payment?.method === "vnpay" && order.payment?.payment_status === "pending" && (
                                        <div className="bg-black/30 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                                            <p className="text-gray-300 text-sm">Đơn hàng chưa được thanh toán qua VNPay. Nhấn bên dưới để tiếp tục thanh toán.</p>
                                            <button
                                                className="group relative overflow-hidden px-8 py-3 border border-blue-500/60 text-blue-300 rounded-lg cursor-pointer disabled:opacity-60"
                                                onClick={handleRetryVnpay}
                                                disabled={isRetryingVnpay}
                                            >
                                                <span className="absolute inset-0 bg-blue-500 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                                <span className="relative z-10 text-sm font-bold tracking-widest group-hover:text-white transition-colors">
                                                    {isRetryingVnpay ? "ĐANG XỬ LÝ..." : "THANH TOÁN VNPAY"}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        className="group relative overflow-hidden px-8 py-3 border border-red-500/40 text-red-400 rounded-lg cursor-pointer"
                                        onClick={handleCancelOrder}
                                    >
                                        <span className="absolute inset-0 bg-red-500 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                        <span className="relative z-10 text-sm font-bold tracking-widest group-hover:text-black transition-colors">HỦY ĐƠN HÀNG</span>
                                    </button>
                                </div>
                            )}

                            {order.status === "cancelled" && order.payment?.refund_requested_at && (
                                <div data-aos="fade-up" data-aos-delay="220" className="bg-black/30 border border-amber-500/35 rounded-xl p-6 space-y-3">
                                    <h3 className="text-lg font-bold text-amber-300 uppercase tracking-widest">Thông tin hoàn tiền đã gửi</h3>
                                    <p className="text-sm text-gray-300">Yêu cầu hoàn tiền của bạn đã được gửi cho admin và sẽ được xử lý qua chuyển khoản ngân hàng.</p>
                                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <p className="text-gray-400 mb-1">Ngân hàng</p>
                                            <p className="text-white font-semibold">{order.payment?.refund_bank_name || "-"}</p>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <p className="text-gray-400 mb-1">Số tài khoản</p>
                                            <p className="text-white font-semibold font-mono">{order.payment?.refund_account_number || "-"}</p>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <p className="text-gray-400 mb-1">Tên chủ tài khoản</p>
                                            <p className="text-white font-semibold">{order.payment?.refund_account_name || "-"}</p>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <p className="text-gray-400 mb-1">Ghi chú</p>
                                            <p className="text-white">{order.payment?.refund_note || "-"}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-amber-200/90">Hiện tại hệ thống chỉ hỗ trợ hoàn tiền qua chuyển khoản ngân hàng.</p>
                                </div>
                            )}

                            {order.status === "completed" && (
                                <div data-aos="fade-up" data-aos-delay="250" className="bg-black/30 border border-white/10 rounded-xl p-8">
                                    <h3 className="text-xl font-bold text-[#e4c590] mb-6 uppercase tracking-widest">Đánh giá đơn hàng</h3>

                                    {order.review ? (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Đánh giá trung bình của đơn</p>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span key={star} className={`text-3xl ${star <= Math.round(Number(order.review.rating || 0)) ? "text-[#e4c590]" : "text-gray-600"}`}>
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span className="ml-3 text-lg font-semibold text-[#e4c590]">{Number(order.review.rating || 0).toFixed(2)}/5</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-gray-400 text-xs uppercase tracking-widest">Đánh giá theo từng món</p>
                                                {(order.review.items || []).map((item) => (
                                                    <div key={item.menu_item_id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-2">
                                                        <span className="text-sm text-gray-300">{item.menu_item_name}</span>
                                                        <span className="text-amber-300 font-semibold">{item.rating}/5 ★</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Nội dung</p>
                                                <p className="text-white italic">{order.review.content}</p>
                                            </div>
                                            <div className="pt-4">
                                                <span className="text-sm text-green-400 font-semibold">✓ Bạn đã đánh giá đơn hàng này</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <p className="text-gray-400 text-xs uppercase tracking-widest">Đánh giá theo từng món</p>
                                                {(order.items || []).map((item) => (
                                                    <div key={item.menu_item_id} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                            <p className="text-sm text-white font-semibold">{item.name}</p>
                                                            <div className="flex items-center gap-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        className={`text-2xl transition cursor-pointer ${star <= Number(itemRatings[item.menu_item_id] || 0) ? "text-[#e4c590]" : "text-gray-600 hover:text-yellow-400"}`}
                                                                        onClick={() => handleSetItemRating(item.menu_item_id, star)}
                                                                        disabled={submittingReview}
                                                                    >
                                                                        ★
                                                                    </button>
                                                                ))}
                                                                <span className="ml-2 text-sm text-gray-300">{Number(itemRatings[item.menu_item_id] || 0)}/5</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <p className="text-sm text-[#e4c590]">
                                                    Điểm trung bình: {Number(computeAverageItemRating(itemRatings, order.items) || 0).toFixed(2)}/5
                                                </p>
                                            </div>

                                            <label className="flex flex-col gap-2">
                                                <span className="text-gray-400 text-xs uppercase tracking-widest">Chia sẻ cảm nhận chung cho đơn</span>
                                                <textarea
                                                    className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#e4c590] transition-colors resize-none"
                                                    rows={5}
                                                    placeholder="Bạn cảm thấy sao về đơn hàng này?..."
                                                    value={reviewContent}
                                                    onChange={(e) => setReviewContent(e.target.value)}
                                                    disabled={submittingReview}
                                                />
                                            </label>

                                            <button
                                                className="group relative overflow-hidden w-full px-8 py-3 border border-[#e4c590]/60 text-[#e4c590] rounded-lg cursor-pointer disabled:opacity-60"
                                                onClick={handleSubmitReview}
                                                disabled={submittingReview}
                                            >
                                                <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                                <span className="relative z-10 text-sm font-bold tracking-widest group-hover:text-black transition-colors">
                                                    {submittingReview ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ"}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-gray-400">Đang tải chi tiết đơn hàng...</p>
                        </div>
                    )}
                </div>
            </div>

            <CustomerConfirmModal
                isOpen={isCancelConfirmOpen}
                title="Xác nhận hủy đơn hàng"
                description={isRefundInfoRequired
                    ? "Đơn hàng sẽ được hủy. Thông tin chuyển khoản bạn đã cung cấp sẽ được gửi cho admin để xử lý hoàn tiền."
                    : "Đơn hàng sẽ chuyển sang trạng thái đã hủy và không thể khôi phục."}
                confirmText="Hủy đơn"
                cancelText="Giữ đơn"
                tone="danger"
                busy={isCancellingOrder}
                onConfirm={handleCancelOrderConfirmed}
                onClose={() => setIsCancelConfirmOpen(false)}
            />

            {isRefundFormOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsRefundFormOpen(false);
                        }
                    }}
                >
                    <div className="bg-linear-to-b from-black/60 to-black/80 border border-amber-500/30 text-white rounded-2xl p-6 w-full max-w-xl shadow-2xl">
                        <h2 className="text-xl font-bold text-amber-300">Thông tin nhận hoàn tiền</h2>
                        <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                            Đơn hàng đã thanh toán bằng {getPaymentMethodText(order?.payment?.method)}. Vui lòng cung cấp thông tin chuyển khoản để admin hoàn tiền.
                        </p>
                        <p className="text-xs text-amber-200 mt-2">Hiện tại hệ thống chỉ hỗ trợ hoàn tiền qua chuyển khoản ngân hàng.</p>

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                value={refundForm.bankName}
                                onChange={(e) => handleRefundInputChange("bankName", e.target.value)}
                                placeholder="Ngân hàng (VD: Vietcombank)"
                                className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                            />
                            <input
                                value={refundForm.accountNumber}
                                onChange={(e) => handleRefundInputChange("accountNumber", e.target.value)}
                                placeholder="Số tài khoản"
                                className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                            />
                            <input
                                value={refundForm.accountName}
                                onChange={(e) => handleRefundInputChange("accountName", e.target.value)}
                                placeholder="Tên chủ tài khoản"
                                className="md:col-span-2 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                            />
                            <textarea
                                rows={3}
                                value={refundForm.note}
                                onChange={(e) => handleRefundInputChange("note", e.target.value)}
                                placeholder="Ghi chú thêm (không bắt buộc)"
                                className="md:col-span-2 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 resize-none"
                            />
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsRefundFormOpen(false)}
                                className="flex-1 px-5 py-3 bg-black/30 border border-white/10 text-gray-300 rounded-lg hover:border-white/30 transition-colors text-sm font-semibold cursor-pointer"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenRefundConfirm}
                                className="flex-1 px-5 py-3 border border-amber-500/60 text-amber-300 rounded-lg hover:bg-amber-500 hover:text-black transition-colors text-sm font-semibold cursor-pointer"
                            >
                                Tiếp tục hủy đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default OrderDetailPage;