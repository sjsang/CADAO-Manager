import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../api/orderApi";
import authApi from "../../api/authApi";

const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
};

const ShipperDeliveries = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [completing, setCompleting] = useState(null);

    const token = sessionStorage.getItem("token");
    let shipperName = "Shipper";
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            shipperName = payload?.full_name || payload?.username || "Shipper";
        } catch {
            shipperName = "Shipper";
        }
    }

    const loadOrders = async () => {
        try {
            const res = await orderApi.getMyDeliveries();
            setOrders(res.data?.data || []);
        } catch (error) {
            console.error("Failed to load deliveries:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                sessionStorage.removeItem("token");
                navigate("/admin/login", { replace: true });
            }
        }
    };

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await loadOrders();
            setIsLoading(false);
        };
        init();
    }, []);

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch {
            // ignore
        } finally {
            sessionStorage.removeItem("token");
            navigate("/admin/login", { replace: true });
        }
    };

    const handleComplete = async (orderCode) => {
        const confirmed = window.confirm(`Xác nhận đã giao thành công đơn ${orderCode}?`);
        if (!confirmed) return;

        setCompleting(orderCode);
        try {
            await orderApi.completeDelivery(orderCode);
            setOrders((prev) => prev.filter((o) => o.order_code !== orderCode));
        } catch (error) {
            console.error("Failed to complete delivery:", error);
            alert(error.response?.data?.message || "Không thể cập nhật trạng thái. Vui lòng thử lại.");
        } finally {
            setCompleting(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100/80 px-6 py-4 backdrop-blur">
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] text-violet-500 uppercase">CADAO Shipper</p>
                            <h1 className="mt-1 text-2xl font-bold text-slate-800">Đơn hàng cần giao</h1>
                            <p className="mt-1 text-sm text-slate-500">Danh sách các đơn hàng được phân công cho bạn.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700 sm:inline-block">
                                {shipperName}
                            </span>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24 text-slate-500">Đang tải danh sách đơn hàng...</div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-24 shadow-sm text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-semibold">Không có đơn hàng nào cần giao</p>
                        <p className="text-sm">Tất cả đơn hàng được phân công đã hoàn thành.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {orders.map((order) => (
                            <div
                                key={order.order_code}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mã đơn</p>
                                        <p className="mt-0.5 text-base font-bold text-slate-800">{order.order_code}</p>
                                    </div>
                                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                        Đang giao
                                    </span>
                                </div>

                                <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
                                    <div className="flex gap-2">
                                        <span className="w-28 shrink-0 font-medium text-slate-500">Người nhận</span>
                                        <span className="text-slate-800">{order.delivery_full_name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-28 shrink-0 font-medium text-slate-500">Điện thoại</span>
                                        <a href={`tel:${order.delivery_phone}`} className="font-medium text-violet-600 hover:underline">
                                            {order.delivery_phone}
                                        </a>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-28 shrink-0 font-medium text-slate-500">Địa chỉ</span>
                                        <span className="text-slate-800">{order.delivery_address}{order.delivery_ward_name ? `, ${order.delivery_ward_name}` : ""}</span>
                                    </div>
                                    {order.notes ? (
                                        <div className="flex gap-2">
                                            <span className="w-28 shrink-0 font-medium text-slate-500">Ghi chú</span>
                                            <span className="text-slate-700 italic">{order.notes}</span>
                                        </div>
                                    ) : null}
                                    <div className="flex gap-2">
                                        <span className="w-28 shrink-0 font-medium text-slate-500">Tổng tiền</span>
                                        <span className="font-semibold text-slate-800">{Number(order.total_amount || 0).toLocaleString("vi-VN")}đ</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-28 shrink-0 font-medium text-slate-500">Đặt lúc</span>
                                        <span className="text-slate-600">{formatDateTime(order.created_at)}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={completing === order.order_code}
                                    onClick={() => handleComplete(order.order_code)}
                                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                >
                                    {completing === order.order_code ? "Đang xử lý..." : "Đã giao thành công"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ShipperDeliveries;
