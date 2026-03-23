import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import orderApi from "../../api/orderApi";
import { getPaymentMethodText, getPaymentStatusText, getStatusText } from "../../functions/formatOrderFields";
import { formatDateDDMMYYYY, formatElapsedTime } from "../../functions/formatDate";

const CANCEL_REASONS = [
    "Khách hàng yêu cầu hủy đơn",
    "Món ăn tạm hết hàng",
    "Không thể liên hệ khách hàng",
    "Địa chỉ giao hàng không hợp lệ",
    "Ngoài phạm vi phục vụ",
    "Lý do khác"
];

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

const STATUS_BADGE_CLASS = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    confirmed: "bg-sky-50 text-sky-700 border border-sky-200",
    preparing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    shipping: "bg-violet-50 text-violet-700 border border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border border-rose-200"
};

const ADMIN_ACTIONS = {
    pending: [
        { status: "confirmed", label: "Xác nhận đơn", className: "bg-sky-600 hover:bg-sky-700" },
        { status: "cancelled", label: "Hủy đơn", className: "bg-rose-600 hover:bg-rose-700" }
    ],
    confirmed: [
        { status: "preparing", label: "Bắt đầu chuẩn bị", className: "bg-indigo-600 hover:bg-indigo-700" },
        { status: "cancelled", label: "Hủy đơn", className: "bg-rose-600 hover:bg-rose-700" }
    ],
    preparing: [
        { status: "shipping", label: "Chuyển sang giao hàng", className: "bg-violet-600 hover:bg-violet-700" },
        { status: "cancelled", label: "Hủy đơn", className: "bg-rose-600 hover:bg-rose-700" }
    ],
    shipping: [
        { status: "completed", label: "Hoàn thành đơn", className: "bg-emerald-600 hover:bg-emerald-700" }
    ],
    completed: [],
    cancelled: []
};

const InfoRow = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-800">{value || "-"}</p>
    </div>
);

const TimelineItem = ({ label, value, note, actor }) => (
    <div className="flex gap-3">
        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
        <div>
            <p className="text-sm font-medium text-slate-800">{label}</p>
            <p className="text-sm text-slate-500">{value}</p>
            {note ? <p className="mt-1 text-sm text-slate-600">Lý do: {note}</p> : null}
            {actor ? <p className="mt-1 text-xs text-slate-400">Thực hiện bởi: {actor}</p> : null}
        </div>
    </div>
);

const buildTimelineItem = (history) => {
    if (history.to_status === "cart") {
        return {
            key: `history-${history.id}`,
            label: "Giỏ hàng khởi tạo",
            value: formatDateTime(history.created_at),
            note: history.note,
            actor: history.full_name || history.username || ""
        };
    }

    if (history.from_status === "cart" && history.to_status === "pending") {
        return {
            key: `history-${history.id}`,
            label: "Đơn hàng được đặt",
            value: formatDateTime(history.created_at),
            note: history.note,
            actor: history.full_name || history.username || ""
        };
    }

    return {
        key: `history-${history.id}`,
        label: `Cập nhật đơn hàng: ${getStatusText(history.to_status)}`,
        value: formatDateTime(history.created_at),
        note: history.note,
        actor: history.full_name || history.username || ""
    };
};

const AdminOrderDetail = () => {
    const { orderCode } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedCancelReason, setSelectedCancelReason] = useState(CANCEL_REASONS[0]);
    const [customCancelReason, setCustomCancelReason] = useState("");
    const [isShipperModalOpen, setIsShipperModalOpen] = useState(false);
    const [shippers, setShippers] = useState([]);
    const [selectedShipperId, setSelectedShipperId] = useState("");
    const [isLoadingShippers, setIsLoadingShippers] = useState(false);
    const [nowTs, setNowTs] = useState(Date.now());

    const loadOrder = useCallback(async () => {
        const response = await orderApi.getByOrderCode(orderCode);
        setOrder(response.data?.data || null);
    }, [orderCode]);

    useEffect(() => {
        const fetchOrder = async () => {
            setIsLoading(true);
            try {
                await loadOrder();
            } catch (error) {
                console.error("Failed to fetch admin order detail:", error);
                alert("Không tải được chi tiết đơn hàng.");
                navigate("/admin/orders");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [loadOrder, navigate]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowTs(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const processingDuration = order
        ? formatElapsedTime(
            order.created_at,
            order.status === "completed" || order.status === "cancelled"
                ? (order.updated_at || order.created_at)
                : nowTs
        )
        : "-";

    const availableActions = !order?.status ? [] : (ADMIN_ACTIONS[order.status] || []);

    const timelineItems = (order?.status_history || []).map(buildTimelineItem);

    const closeCancelModal = () => {
        setIsCancelModalOpen(false);
        setSelectedCancelReason(CANCEL_REASONS[0]);
        setCustomCancelReason("");
    };

    const getCancelNote = () => {
        if (selectedCancelReason === "Lý do khác") {
            return customCancelReason.trim();
        }

        return selectedCancelReason;
    };

    const handleStatusUpdate = async (nextStatus, note, shipperId) => {
        const confirmed = window.confirm(`Bạn có chắc muốn chuyển đơn hàng sang trạng thái "${getStatusText(nextStatus)}"?`);

        if (!confirmed) {
            return false;
        }

        setIsUpdating(true);

        try {
            await orderApi.updateStatusByAdmin(orderCode, nextStatus, note, shipperId);
            await loadOrder();
            return true;
        } catch (error) {
            console.error("Failed to update order status:", error);
            alert(error.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng.");
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    const openShipperModal = async () => {
        setIsShipperModalOpen(true);
        setSelectedShipperId("");
        setIsLoadingShippers(true);
        try {
            const res = await orderApi.getShippers();
            setShippers(res.data?.data || []);
        } catch (error) {
            console.error("Failed to load shippers:", error);
            setShippers([]);
        } finally {
            setIsLoadingShippers(false);
        }
    };

    const closeShipperModal = () => {
        setIsShipperModalOpen(false);
        setSelectedShipperId("");
        setShippers([]);
    };

    const handleConfirmShipping = async () => {
        if (!selectedShipperId) {
            alert("Vui lòng chọn người giao hàng.");
            return;
        }

        const didUpdate = await handleStatusUpdate("shipping", null, Number(selectedShipperId));

        if (didUpdate) {
            closeShipperModal();
        }
    };

    const handleActionClick = async (nextStatus) => {
        if (nextStatus === "cancelled") {
            setIsCancelModalOpen(true);
            return;
        }

        if (nextStatus === "shipping") {
            await openShipperModal();
            return;
        }

        await handleStatusUpdate(nextStatus);
    };

    const handleConfirmCancel = async () => {
        const cancelNote = getCancelNote();

        if (!cancelNote) {
            alert("Vui lòng chọn hoặc nhập lý do hủy đơn.");
            return;
        }

        const didCancel = await handleStatusUpdate("cancelled", cancelNote);

        if (didCancel) {
            closeCancelModal();
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="orders" />
                <div className="flex flex-1 items-center justify-center text-slate-600">Đang tải chi tiết đơn hàng...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="orders" />
                <div className="flex flex-1 items-center justify-center text-slate-600">Không tìm thấy đơn hàng.</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="orders" />

            <div className="flex-1">
                <AdminHeader
                    title={`Đơn hàng ${order.order_code}`}
                    subtitle="Theo dõi thông tin giao nhận, thanh toán và xử lý trạng thái đơn hàng."
                />

                <main className="p-6">
                    <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Mã đơn hàng</p>
                                    <h2 className="mt-1 text-2xl font-bold text-slate-800">{order.order_code}</h2>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${STATUS_BADGE_CLASS[order.status] || "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {processingDuration}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <InfoRow label="Người nhận" value={order.delivery_full_name} />
                                <InfoRow label="Số điện thoại" value={order.delivery_phone} />
                                <InfoRow label="Phường" value={order.delivery_ward_name} />
                                <InfoRow label="Địa chỉ" value={order.delivery_address} />
                                <InfoRow label="Ghi chú" value={order.notes} />
                                <InfoRow label="Phương thức thanh toán" value={getPaymentMethodText(order.payment?.method)} />
                                <InfoRow label="Trạng thái thanh toán" value={getPaymentStatusText(order.payment?.payment_status)} />
                                <InfoRow label="Tạm tính" value={`${Number(order.subtotal || 0).toLocaleString("vi-VN")}đ`} />
                                <InfoRow label="Phí vận chuyển" value={`${Number(order.shipping_fee || 0).toLocaleString("vi-VN")}đ`} />
                                <InfoRow label="Giảm giá" value={`${Number(order.discount_amount || 0).toLocaleString("vi-VN")}đ`} />
                                <InfoRow label="Tổng thanh toán" value={`${Number(order.total_amount || 0).toLocaleString("vi-VN")}đ`} />
                            </div>
                        </div>

                        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-800">Thao tác đơn hàng</h3>
                            <p className="mt-2 text-sm text-slate-500">Các thao tác sẽ thay đổi trạng thái xử lý của đơn theo đúng quy trình vận hành.</p>

                            <div className="mt-5 flex flex-col gap-3">
                                {availableActions.map((action) => (
                                    <button
                                        key={action.status}
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={() => handleActionClick(action.status)}
                                        className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${action.className}`}
                                    >
                                        {isUpdating ? "Đang xử lý..." : action.label}
                                    </button>
                                ))}

                                {availableActions.length === 0 ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        Đơn hàng này không còn thao tác tiếp theo.
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/orders")}
                                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    Quay lại danh sách đơn
                                </button>
                            </div>
                        </aside>
                    </section>

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="border-b border-slate-200 pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Mốc thời gian</h3>
                            <p className="mt-1 text-sm text-slate-500">Theo dõi tiến trình xử lý và thanh toán của đơn hàng.</p>
                        </div>

                        <div className="mt-5 space-y-4">
                            {timelineItems.map((item) => (
                                <TimelineItem key={item.key} label={item.label} value={item.value} note={item.note} actor={item.actor} />
                            ))}
                        </div>
                    </section>

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h3 className="text-lg font-semibold text-slate-800">Món trong đơn</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tên món</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Số lượng</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Đơn giá</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Thành tiền</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {order.items?.map((item, index) => (
                                        <tr key={`${item.name}-${index}`} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{item.quantity}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{Number(item.price || 0).toLocaleString("vi-VN")}đ</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{Number((item.price || 0) * (item.quantity || 0)).toLocaleString("vi-VN")}đ</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{item.note || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {order.status === "completed" && (
                        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="border-b border-slate-200 pb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Đánh giá từ khách hàng</h3>
                                <p className="mt-1 text-sm text-slate-500">Phản hồi của khách hàng sau khi nhận đơn.</p>
                            </div>
                            <div className="mt-5">
                                {order.review ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-3">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <span key={s} className={`text-xl ${s <= order.review.rating ? "text-yellow-400" : "text-slate-300"}`}>★</span>
                                            ))}
                                            <span className="text-sm text-slate-500">{order.review.rating}/5 sao</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">{order.review.content}</p>
                                        <p className="mt-2 text-xs text-slate-400">Đánh giá lúc: {formatDateDDMMYYYY(order.review.created_at)}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500">Khách hàng chưa gửi đánh giá cho đơn hàng này.</p>
                                )}
                            </div>
                        </section>
                    )}
                </main>
            </div>

            {isShipperModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-800">Chọn người giao hàng</h3>
                        <p className="mt-2 text-sm text-slate-500">Vui lòng chọn shipper để giao đơn hàng này.</p>

                        <div className="mt-5">
                            {isLoadingShippers ? (
                                <p className="text-sm text-slate-500">Đang tải danh sách shipper...</p>
                            ) : shippers.length === 0 ? (
                                <p className="text-sm text-rose-500">Hiện không có shipper nào đang hoạt động.</p>
                            ) : (
                                <select
                                    value={selectedShipperId}
                                    onChange={(e) => setSelectedShipperId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                                >
                                    <option value="">-- Chọn người giao hàng --</option>
                                    {shippers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name || s.username}{s.phone_number ? ` — ${s.phone_number}` : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeShipperModal}
                                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                disabled={isUpdating || isLoadingShippers || shippers.length === 0}
                                onClick={handleConfirmShipping}
                                className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                            >
                                {isUpdating ? "Đang xử lý..." : "Xác nhận giao hàng"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {isCancelModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-800">Chọn lý do hủy đơn</h3>
                        <p className="mt-2 text-sm text-slate-500">Lý do này sẽ được lưu vào lịch sử xử lý đơn hàng.</p>

                        <div className="mt-5 space-y-3">
                            <select
                                value={selectedCancelReason}
                                onChange={(e) => setSelectedCancelReason(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                            >
                                {CANCEL_REASONS.map((reason) => (
                                    <option key={reason} value={reason}>{reason}</option>
                                ))}
                            </select>

                            {selectedCancelReason === "Lý do khác" ? (
                                <textarea
                                    rows={4}
                                    value={customCancelReason}
                                    onChange={(e) => setCustomCancelReason(e.target.value)}
                                    placeholder="Nhập lý do hủy đơn"
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                />
                            ) : null}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeCancelModal}
                                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={handleConfirmCancel}
                                className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                            >
                                {isUpdating ? "Đang xử lý..." : "Xác nhận hủy đơn"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default AdminOrderDetail;