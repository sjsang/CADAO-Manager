import { Link, useSearchParams } from "react-router-dom";
import Header from "../../components/customer/Header";

const getMessage = (success, message) => {
    if (success) {
        return "Thanh toán VNPay thành công.";
    }

    const errorMap = {
        payment_failed: "Thanh toán thất bại. Vui lòng thử lại.",
        invalid_signature: "Chữ ký thanh toán không hợp lệ.",
        invalid_amount: "Số tiền thanh toán không khớp với đơn hàng.",
        order_not_found: "Không tìm thấy đơn hàng.",
        payment_not_found: "Không tìm thấy thông tin thanh toán.",
        server_error: "Có lỗi hệ thống khi xử lý thanh toán.",
        already_paid: "Đơn hàng đã được thanh toán trước đó."
    };

    return errorMap[message] || "Thanh toán không thành công.";
};

const VnpayReturnPage = () => {
    const [searchParams] = useSearchParams();
    const success = searchParams.get("success") === "1";
    const orderCode = searchParams.get("orderCode") || "";
    const message = searchParams.get("message") || "";
    const code = searchParams.get("code") || "";

    return (
        <div>
            <Header />
            <div className="w-7xl mx-auto py-10 text-white">
                <div className="max-w-2xl mx-auto bg-black/30 border border-white/10 rounded-xl p-8 text-center">
                    <h1 className={`text-3xl font-bold mb-4 ${success ? "text-green-400" : "text-red-400"}`}>
                        {success ? "Thanh toán thành công" : "Thanh toán thất bại"}
                    </h1>
                    <p className="text-gray-300 mb-4">{getMessage(success, message)}</p>
                    {!!orderCode && (
                        <p className="text-[#e4c590] font-semibold mb-6">Mã đơn hàng: {orderCode}</p>
                    )}

                    <div className="flex gap-3 justify-center">
                        {!!orderCode && (
                            <Link
                                to={`/orders/${orderCode}`}
                                className="px-5 py-2.5 border border-[#e4c590]/60 text-[#e4c590] rounded-lg hover:bg-[#e4c590]/10 transition-colors"
                            >
                                Xem chi tiết đơn hàng
                            </Link>
                        )}
                        <Link
                            to="/"
                            className="px-5 py-2.5 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
                        >
                            Về trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VnpayReturnPage;
