import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import customerApi from "../../api/customerApi";
import { formatDateDDMMYYYY } from "../../functions/formatDate";
import { notifyCustomer } from "../../utils/customerNotify";

const buildCloudinaryUrl = (publicId) => {
    if (!publicId) return "";
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${publicId}`;
};

const STATUS_MAP = {
    pending: { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    confirmed: { label: "Đã xác nhận", cls: "bg-sky-50 text-sky-700 border border-sky-200" },
    preparing: { label: "Đang chuẩn bị", cls: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
    shipping: { label: "Đang giao hàng", cls: "bg-violet-50 text-violet-700 border border-violet-200" },
    completed: { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    cancelled: { label: "Đã hủy", cls: "bg-rose-50 text-rose-700 border border-rose-200" },
};

const formatDate = (value) => {
    return formatDateDDMMYYYY(value);
};

const formatCurrency = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

const InfoRow = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-800">{value || "-"}</p>
    </div>
);

const CustomerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: "", phone_number: "", email: "", password: "" });

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const res = await customerApi.getCustomerById(id);
                const data = res.data?.data || null;
                setCustomer(data);
                if (data) {
                    setEditForm({ full_name: data.full_name || "", phone_number: data.phone_number || "", email: data.email || "", password: "" });
                }
            } catch (error) {
                console.error("Error fetching customer detail:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [id]);

    const handleToggleStatus = async () => {
        if (toggling) return;
        setToggling(true);
        try {
            const res = await customerApi.toggleCustomerStatus(id);
            const updated = res.data?.data;
            setCustomer((prev) => ({ ...prev, is_active: updated.is_active }));
        } catch (error) {
            console.error("Error toggling status:", error);
        } finally {
            setToggling(false);
        }
    };

    const handleEditOpen = () => {
        setEditForm({ full_name: customer.full_name || "", phone_number: customer.phone_number || "", email: customer.email || "", password: "" });
        setIsEditing(true);
    };

    const handleEditSave = async () => {
        if (!editForm.full_name.trim() || !editForm.phone_number.trim()) {
            notifyCustomer({ message: "Họ tên và số điện thoại không được để trống.", type: "warning" });
            return;
        }
        if (editForm.password && editForm.password.length < 6) {
            notifyCustomer({ message: "Mật khẩu phải có ít nhất 6 ký tự.", type: "warning" });
            return;
        }
        setSaving(true);
        try {
            const res = await customerApi.updateCustomerByAdmin(id, {
                full_name: editForm.full_name.trim(),
                phone_number: editForm.phone_number.trim(),
                email: editForm.email.trim(),
                password: editForm.password || undefined
            });
            setCustomer((prev) => ({ ...prev, ...res.data?.data }));
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving customer:", error);
            notifyCustomer({ message: error.response?.data?.message || "Không thể lưu thay đổi.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="customers" />

            <div className="flex-1">
                <AdminHeader
                    title="Chi tiết khách hàng"
                    subtitle="Thông tin đầy đủ, địa chỉ và lịch sử đơn hàng."
                />

                <main className="p-6 space-y-6">
                    {/* Back button */}
                    <button
                        onClick={() => navigate("/admin/customers")}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>

                    {loading ? (
                        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                            Đang tải dữ liệu...
                        </div>
                    ) : !customer ? (
                        <div className="flex h-40 items-center justify-center text-sm text-rose-500">
                            Không tìm thấy khách hàng.
                        </div>
                    ) : (
                        <>
                            {/* Basic info */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-6 flex items-start justify-between gap-6">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-300 bg-slate-100">
                                            {customer.avatar_url ? (
                                                <img
                                                    src={buildCloudinaryUrl(customer.avatar_url)}
                                                    alt="Avatar khách hàng"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">Chưa có ảnh</div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">ID: {customer.id}</p>
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h2 className="text-base font-semibold text-slate-800">Thông tin cơ bản</h2>
                                            <div className="flex items-center gap-3">
                                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${customer.is_active ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                    {customer.is_active ? "Đang hoạt động" : "Đã khóa"}
                                                </span>
                                                {!isEditing && (
                                                    <button
                                                        onClick={handleEditOpen}
                                                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        Chỉnh sửa
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleToggleStatus}
                                                    disabled={toggling}
                                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${customer.is_active
                                                        ? "bg-rose-600 text-white hover:bg-rose-700"
                                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                                        }`}
                                                >
                                                    {toggling ? "Đang xử lý..." : customer.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Họ và tên <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={editForm.full_name}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Số điện thoại <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={editForm.phone_number}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                                                <input
                                                    type="email"
                                                    value={editForm.email}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mật khẩu mới <span className="text-slate-400">(để trống nếu không đổi)</span></label>
                                                <input
                                                    type="password"
                                                    value={editForm.password}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                                                    placeholder="Ít nhất 6 ký tự"
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={handleEditSave}
                                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                            >
                                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <InfoRow label="Họ và tên" value={customer.full_name} />
                                        <InfoRow label="Số điện thoại" value={customer.phone_number} />
                                        <InfoRow label="Email" value={customer.email} />
                                        <InfoRow label="Ngày tạo tài khoản" value={formatDate(customer.created_at)} />
                                    </div>
                                )}
                            </div>

                            {/* Addresses */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-base font-semibold text-slate-800">
                                    Danh sách địa chỉ ({customer.addresses?.length ?? 0})
                                </h2>
                                {customer.addresses?.length === 0 ? (
                                    <p className="text-sm text-slate-500">Khách hàng chưa có địa chỉ nào.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {customer.addresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                className={`flex items-start justify-between rounded-xl border px-4 py-3 ${addr.is_default ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
                                            >
                                                <div>
                                                    <p className="text-sm text-slate-800">
                                                        {addr.address_line}, {addr.ward_name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        Phí giao hàng: {formatCurrency(addr.shipping_fee)}
                                                    </p>
                                                </div>
                                                {addr.is_default && (
                                                    <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                                        Mặc định
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Order history */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-base font-semibold text-slate-800">
                                    Lịch sử đơn hàng ({customer.orders?.length ?? 0})
                                </h2>
                                {customer.orders?.length === 0 ? (
                                    <p className="text-sm text-slate-500">Khách hàng chưa có đơn hàng nào.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mã đơn</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Người nhận</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Địa chỉ</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng tiền</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày tạo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {customer.orders.map((order) => {
                                                    const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-slate-100 text-slate-600" };
                                                    return (
                                                        <tr key={order.order_code} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-sm font-mono text-slate-700">{order.order_code}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_full_name || "-"}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-50 truncate">{order.delivery_address || "-"}</td>
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{formatCurrency(order.total_amount)}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.cls}`}>
                                                                    {statusInfo.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-600">{formatDate(order.created_at)}</td>
                                                            <td className="px-4 py-3">
                                                                <button
                                                                    onClick={() => navigate(`/admin/orders/${order.order_code}`)}
                                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                                                >
                                                                    Xem đơn
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CustomerDetail;
