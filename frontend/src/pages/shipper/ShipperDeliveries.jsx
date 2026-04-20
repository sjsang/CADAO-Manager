import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import CustomerConfirmModal from "../../components/customer/CustomerConfirmModal";
import orderApi from "../../api/orderApi";
import { formatDateDDMMYYYY, formatElapsedTime } from "../../functions/formatDate";
import { notifyCustomer } from "../../utils/customerNotify";

const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${hour}:${minute} ${day}/${month}/${year}`;
};

const ShipperDeliveries = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [completing, setCompleting] = useState(null);
    const [activeTab, setActiveTab] = useState("shipping");
    const [nowTs, setNowTs] = useState(Date.now());
    const [confirmOrderCode, setConfirmOrderCode] = useState(null);
    const [cancelOrderCode, setCancelOrderCode] = useState(null);
    const [cancelReason, setCancelReason] = useState("");

    const loadOrders = useCallback(async () => {
        try {
            const [shippingRes, historyRes] = await Promise.all([
                orderApi.getMyDeliveries(),
                orderApi.getMyDeliveryHistory()
            ]);
            setOrders(shippingRes.data?.data || []);
            setHistoryOrders(historyRes.data?.data || []);
        } catch (error) {
            console.error("Failed to load deliveries:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                sessionStorage.removeItem("token");
                navigate("/admin/login", { replace: true });
            }
        }
    }, [navigate]);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await loadOrders();
            setIsLoading(false);
        };
        init();
    }, [loadOrders]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowTs(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const getProcessingDuration = (order) => {
        if (order.status === "completed" || order.status === "cancelled") {
            return formatElapsedTime(order.created_at, order.updated_at || order.created_at);
        }

        return formatElapsedTime(order.created_at, nowTs);
    };

    const handleComplete = (orderCode) => {
        setConfirmOrderCode(orderCode);
    };

    const handleCompleteConfirmed = async () => {
        setCompleting(confirmOrderCode);
        try {
            await orderApi.completeDelivery(confirmOrderCode);
            await loadOrders();
            notifyCustomer({ message: "Cập nhật trạng thái giao hàng thành công.", type: "success" });
        } catch (error) {
            console.error("Failed to complete delivery:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Không thể cập nhật trạng thái. Vui lòng thử lại.",
                type: "error"
            });
        } finally {
            setCompleting(null);
            setConfirmOrderCode(null);
        }
    };

    const handleCancelDelivery = (orderCode) => {
        setCancelOrderCode(orderCode);
        setCancelReason("");
    };

    const handleCancelConfirmed = async () => {
        setCompleting(cancelOrderCode);
        try {
            await orderApi.cancelDelivery(cancelOrderCode, cancelReason.trim() || null);
            await loadOrders();
            notifyCustomer({ message: "Đã hủy đơn hàng thành công.", type: "success" });
        } catch (error) {
            console.error("Failed to cancel delivery:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Không thể hủy đơn hàng. Vui lòng thử lại.",
                type: "error"
            });
        } finally {
            setCompleting(null);
            setCancelOrderCode(null);
            setCancelReason("");
        }
    };

    const statusBadgeClass = (status) => {
        if (status === "completed") {
            return "border border-emerald-200 bg-emerald-50 text-emerald-700";
        }
        if (status === "cancelled") {
            return "border border-rose-200 bg-rose-50 text-rose-700";
        }
        return "border border-violet-200 bg-violet-50 text-violet-700";
    };

    const statusText = (status) => {
        if (status === "completed") return "Đã giao";
        if (status === "cancelled") return "Đã hủy";
        return "Đang giao";
    };

    const activeOrders = activeTab === "shipping" ? orders : historyOrders;

    return (
        <>
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="orders" />

                <div className="flex-1">
                    <AdminHeader
                        title="Đơn hàng cần giao"
                        subtitle="Theo dõi đơn đang giao và cập nhật hoàn thành khi giao thành công."
                    />

                    <main className="p-6">
                        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <p className="text-sm text-slate-500">
                                    {activeTab === "shipping" ? "Tổng số đơn đang giao:" : "Tổng số đơn lịch sử:"} <span className="font-semibold text-slate-800">{activeOrders.length}</span>
                                </p>
                                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("shipping")}
                                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${activeTab === "shipping" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        Đơn cần giao ({orders.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("history")}
                                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${activeTab === "history" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        Lịch sử ({historyOrders.length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                                Đang tải danh sách đơn hàng...
                            </div>
                        ) : activeOrders.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                                {activeTab === "shipping" ? "Không có đơn hàng nào cần giao." : "Chưa có đơn hàng trong lịch sử."}
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {activeOrders.map((order) => (
                                    <div key={order.order_code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mã đơn</p>
                                                <p className="mt-1 text-base font-bold text-slate-800">{order.order_code}</p>
                                            </div>
                                            <div className="flex ite-ce gap-1.5">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(order.status)}`}>
                                                    {statusText(order.status)}
                                                </span>
                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                                    {getProcessingDuration(order)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">Người nhận:</span> {order.delivery_full_name || "-"}</p>
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">Số điện thoại:</span> {order.delivery_phone || "-"}</p>
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">Địa chỉ:</span> {order.delivery_address}{order.delivery_ward_name ? `, ${order.delivery_ward_name}` : ""}</p>
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">Tổng tiền:</span> {Number(order.total_amount || 0).toLocaleString("vi-VN")}đ</p>
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">Đặt lúc:</span> {formatDateTime(order.created_at)}</p>
                                            {activeTab === "history" ? (
                                                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">Hoàn tất lúc:</span> {formatDateTime(order.updated_at)}</p>
                                            ) : null}
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-500">Ghi chú đơn hàng:</span> {order.notes || "-"}
                                            </p>
                                        </div>

                                        {activeTab === "shipping" ? (
                                            <div className="mt-4 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    disabled={completing === order.order_code}
                                                    onClick={() => handleCancelDelivery(order.order_code)}
                                                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                                                >
                                                    {completing === order.order_code ? "Đang xử lý..." : "Hủy đơn"}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={completing === order.order_code}
                                                    onClick={() => handleComplete(order.order_code)}
                                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                                >
                                                    {completing === order.order_code ? "Đang xử lý..." : "Đã giao"}
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <CustomerConfirmModal
                isOpen={confirmOrderCode !== null}
                title="Xác nhận đã giao hàng"
                description={confirmOrderCode ? `Bạn xác nhận đã giao thành công đơn ${confirmOrderCode}?` : ""}
                confirmText="Đã giao"
                cancelText="Hủy"
                tone="default"
                busy={completing !== null}
                onConfirm={handleCompleteConfirmed}
                onClose={() => setConfirmOrderCode(null)}
            />

            {cancelOrderCode !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-2 text-lg font-semibold text-slate-800">Xác nhận hủy đơn hàng</h3>
                        <p className="mb-4 text-sm text-slate-600">
                            Bạn muốn hủy đơn <span className="font-semibold">{cancelOrderCode}</span>?
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Lý do hủy đơn (không bắt buộc)..."
                            rows={3}
                            className="mb-4 w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setCancelOrderCode(null);
                                    setCancelReason("");
                                }}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                disabled={completing !== null}
                                onClick={handleCancelConfirmed}
                                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                            >
                                {completing !== null ? "Đang xử lý..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShipperDeliveries;
