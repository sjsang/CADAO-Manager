import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AOS from "aos";
import { getStatusText, getPaymentMethodText, getPaymentStatusText } from "../../functions/formatOrderFields";

import orderApi from "../../api/orderApi";
import Header from "../../components/customer/Header";
import { notifyCustomer } from "../../utils/customerNotify";

const OrderDetailPage = () => {
    const { orderCode } = useParams();
    const [order, setOrder] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewContent, setReviewContent] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

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
                    setReviewRating(Number(fetchedOrder.review.rating) || 5);
                    setReviewContent(fetchedOrder.review.content || "");
                }
                AOS.refresh();
            } catch (error) {
                console.error("Failed to fetch order detail:", error);
            }
        };

        fetchOrderDetail();
    }, [orderCode]);

    const handleCancelOrder = async () => {
        if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
            try {
                await orderApi.cancel(orderCode);
                setOrder({ ...order, status: "cancelled" });
            } catch (error) {
                console.error("Failed to cancel order:", error);
            }
        }
    };

    const handleSubmitReview = async () => {
        if (submittingReview) {
            return;
        }

        if (!reviewContent.trim()) {
            notifyCustomer({ message: "Vui lòng nhập nội dung đánh giá.", type: "warning" });
            return;
        }

        try {
            setSubmittingReview(true);
            const response = await orderApi.submitReview(orderCode, {
                rating: reviewRating,
                content: reviewContent.trim()
            });

            setOrder((prev) => ({
                ...prev,
                review: response.data?.data || {
                    rating: reviewRating,
                    content: reviewContent.trim()
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
        <div>
            <Header />

            <div className="w-7xl mx-auto py-16 text-white">
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
                                        <span>Giảm giá</span>
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
                                                <td className="py-3 px-4 text-gray-300">{item.name}</td>
                                                <td className="py-3 px-4 text-center text-gray-300">{item.quantity}</td>
                                                <td className="py-3 px-4 text-right text-gray-400 text-sm">{Number(item.price).toLocaleString('vi-VN')}đ</td>
                                                <td className="py-3 px-4 text-right text-[#e4c590] font-semibold">{Number(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {order.status === "pending" && (
                            <div data-aos="fade-up" data-aos-delay="200">
                                <button
                                    className="group relative overflow-hidden px-8 py-3 border border-red-500/40 text-red-400 rounded-lg cursor-pointer"
                                    onClick={handleCancelOrder}
                                >
                                    <span className="absolute inset-0 bg-red-500 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                    <span className="relative z-10 text-sm font-bold tracking-widest group-hover:text-black transition-colors">HỦY ĐƠN HÀNG</span>
                                </button>
                            </div>
                        )}

                        {order.status === "completed" && (
                            <div data-aos="fade-up" data-aos-delay="250" className="bg-black/30 border border-white/10 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-[#e4c590] mb-6 uppercase tracking-widest">Đánh giá đơn hàng</h3>

                                {order.review ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Đánh giá của bạn</p>
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span key={star} className={`text-3xl ${star <= order.review.rating ? "text-[#e4c590]" : "text-gray-600"}`}>
                                                        ★
                                                    </span>
                                                ))}
                                                <span className="ml-3 text-lg font-semibold text-[#e4c590]">{order.review.rating}/5</span>
                                            </div>
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
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Chọn mức đánh giá</p>
                                            <div className="flex items-center gap-2 mb-6">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className={`text-4xl transition cursor-pointer ${star <= reviewRating ? "text-[#e4c590]" : "text-gray-600 hover:text-yellow-400"}`}
                                                        onClick={() => setReviewRating(star)}
                                                        disabled={submittingReview}
                                                    >
                                                        ★
                                                    </button>
                                                ))}
                                                <span className="ml-3 text-lg font-semibold text-gray-400">{reviewRating}/5</span>
                                            </div>
                                        </div>

                                        <label className="flex flex-col gap-2">
                                            <span className="text-gray-400 text-xs uppercase tracking-widest">Chia sẻ cảm nhận</span>
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
    );
}

export default OrderDetailPage;