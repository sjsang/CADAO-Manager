import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getStatusText, getPaymentMethodText, getPaymentStatusText } from "../../functions/formatOrderFields";

import orderApi from "../../api/orderApi";
import Header from "../../components/customer/Header";

const OrderDetailPage = () => {
    const { orderCode } = useParams();
    const [order, setOrder] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewContent, setReviewContent] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

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
            alert("Vui lòng nhập nội dung đánh giá.");
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

            alert("Đã gửi đánh giá thành công!");
        } catch (error) {
            console.error("Failed to submit review:", error);
            alert(error.response?.data?.message || "Không thể gửi đánh giá.");
        } finally {
            setSubmittingReview(false);
        }
    };


    return (
        <div>
            <Header />

            <div className="w-7xl mx-auto py-8 text-white">
                {order ? (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div>
                            <p><strong>Mã đơn hàng:</strong> {order.order_code}</p>
                            <p><strong>Trạng thái:</strong> {getStatusText(order.status)}</p>

                            <div className="flex gap-6">
                                <div>
                                    <strong>Họ tên người nhận:</strong> {order.delivery_full_name}
                                </div>
                                <div>
                                    <strong>Số điện thoại:</strong> {order.delivery_phone}
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div>
                                    <strong>Địa chỉ:</strong> {order.delivery_address}
                                </div>
                                <div>
                                    <strong>Phường:</strong> {order.delivery_ward_name}
                                </div>
                            </div>

                            <div className="flex">
                                <strong>Ghi chú:</strong>
                                <p className="ml-2">{order.notes || '-'}</p>
                            </div>

                            <p><strong>Phí vận chuyển:</strong> {Number(order.shipping_fee).toLocaleString('vi-VN')} VND</p>
                            <p><strong>Giảm giá:</strong> {Number(order.discount_amount).toLocaleString('vi-VN')} VND</p>
                            <p><strong>Tổng tiền:</strong> {Number(order.total_amount).toLocaleString('vi-VN')} VND</p>

                            <div className="flex items-center">
                                <strong>Phương thức thanh toán:</strong>
                                <p className="ml-2">{getPaymentMethodText(order.payment?.method)}</p>
                            </div>
                            <div className="flex items-center">
                                <strong>Trạng thái thanh toán:</strong>
                                <p className="ml-2">{getPaymentStatusText(order.payment?.payment_status)}</p>
                            </div>

                            {order.status === "pending" && (
                                <button
                                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded duration-300 cursor-pointer hover:bg-red-600"
                                    onClick={handleCancelOrder}
                                >
                                    Hủy đơn hàng
                                </button>
                            )}

                            {order.status === "completed" && (
                                <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900 p-4">
                                    <h3 className="text-lg font-semibold">Đánh giá đơn hàng</h3>

                                    <div className="mt-3 flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`cursor-pointer text-2xl transition ${star <= reviewRating ? "text-yellow-400" : "text-gray-500 hover:text-yellow-300"}`}
                                                onClick={() => setReviewRating(star)}
                                                disabled={submittingReview}
                                                aria-label={`Chọn ${star} sao`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                        <span className="ml-2 text-sm text-gray-300">{reviewRating}/5 sao</span>
                                    </div>

                                    <textarea
                                        className="mt-3 w-full rounded border border-gray-600 bg-gray-800 p-3 text-white outline-none focus:border-blue-500"
                                        rows={4}
                                        placeholder="Chia sẻ cảm nhận của bạn về đơn hàng..."
                                        value={reviewContent}
                                        onChange={(e) => setReviewContent(e.target.value)}
                                        disabled={submittingReview}
                                    />

                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            onClick={handleSubmitReview}
                                            disabled={submittingReview}
                                        >
                                            {submittingReview ? "Đang gửi..." : order.review ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                                        </button>

                                        {order.review && (
                                            <span className="text-sm text-emerald-400">Bạn đã đánh giá đơn hàng này.</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <hr className="my-3" />

                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="border-b border-gray-700 py-2">Tên món</th>
                                    <th className="border-b border-gray-700 py-2">Số lượng</th>
                                    <th className="border-b border-gray-700 py-2">Giá</th>
                                    <th className="border-b border-gray-700 py-2">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border-b border-gray-700 py-2">{item.name}</td>
                                        <td className="border-b border-gray-700 py-2">{item.quantity}</td>
                                        <td className="border-b border-gray-700 py-2">{Number(item.price).toLocaleString('vi-VN')} VND</td>
                                        <td className="border-b border-gray-700 py-2">{item.note || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Đang tải chi tiết đơn hàng...</p>
                )}
            </div>
        </div>
    );
}

export default OrderDetailPage;