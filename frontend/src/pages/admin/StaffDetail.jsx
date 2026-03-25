import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import userApi from "../../api/userApi";
import { getStatusText } from "../../functions/formatOrderFields";
import { notifyCustomer } from "../../utils/customerNotify";

const ROLE_BADGE = {
    admin: "border border-rose-200 bg-rose-50 text-rose-700",
    shipper: "border border-violet-200 bg-violet-50 text-violet-700"
};

const ROLE_TEXT = {
    admin: "Admin",
    shipper: "Shipper"
};

const STATUS_BADGE_CLASS = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    confirmed: "bg-sky-50 text-sky-700 border border-sky-200",
    preparing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    shipping: "bg-violet-50 text-violet-700 border border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border border-rose-200"
};

const ASSIGNMENT_TEXT = {
    shipper: "Giao hàng"
};

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

const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: "", phone_number: "", role: "shipper", password: "" });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await userApi.getUserById(id);
                const data = res.data?.data || null;
                setUser(data);
                if (data) {
                    setEditForm({ full_name: data.full_name || "", phone_number: data.phone_number || "", role: data.role || "shipper", password: "" });
                }
            } catch (error) {
                console.error("Error fetching user detail:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    const handleToggleStatus = async () => {
        if (toggling || !user) return;
        setToggling(true);
        try {
            const res = await userApi.toggleUserStatus(id);
            const updated = res.data?.data;
            setUser((prev) => ({ ...prev, is_active: updated.is_active }));
        } catch (error) {
            console.error("Error toggling user status:", error);
            notifyCustomer({ message: error?.response?.data?.message || "Không thể cập nhật trạng thái tài khoản.", type: "error" });
        } finally {
            setToggling(false);
        }
    };

    const handleEditOpen = () => {
        setEditForm({ full_name: user.full_name || "", phone_number: user.phone_number || "", role: user.role || "shipper", password: "" });
        setIsEditing(true);
    };

    const handleEditSave = async () => {
        if (!editForm.role) {
            notifyCustomer({ message: "Vai trò không được để trống.", type: "warning" });
            return;
        }
        if (editForm.password && editForm.password.length < 6) {
            notifyCustomer({ message: "Mật khẩu phải có ít nhất 6 ký tự.", type: "warning" });
            return;
        }
        setSaving(true);
        try {
            const res = await userApi.updateUser(id, {
                full_name: editForm.full_name.trim() || null,
                phone_number: editForm.phone_number.trim() || null,
                role: editForm.role,
                password: editForm.password || undefined
            });
            setUser((prev) => ({ ...prev, ...res.data?.data }));
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving user:", error);
            notifyCustomer({ message: error.response?.data?.message || "Không thể lưu thay đổi.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="users" />

            <div className="flex-1">
                <AdminHeader
                    title="Chi tiết tài khoản"
                    subtitle="Theo dõi thông tin tài khoản và các đơn hàng đã được phân công."
                />

                <main className="p-6 space-y-6">
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>

                    {loading ? (
                        <div className="flex h-40 items-center justify-center text-sm text-slate-500">Đang tải dữ liệu...</div>
                    ) : !user ? (
                        <div className="flex h-40 items-center justify-center text-sm text-rose-500">Không tìm thấy tài khoản.</div>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-base font-semibold text-slate-800">Thông tin cơ bản</h2>
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[user.role] || "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                                            {ROLE_TEXT[user.role] || user.role}
                                        </span>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                                            {user.is_active ? "Đang hoạt động" : "Đã khóa"}
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
                                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${user.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                                        >
                                            {toggling ? "Đang xử lý..." : user.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                        </button>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</label>
                                                <input
                                                    type="text"
                                                    value={user.username}
                                                    disabled
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò <span className="text-rose-500">*</span></label>
                                                <select
                                                    value={editForm.role}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="shipper">Shipper</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Họ và tên</label>
                                                <input
                                                    type="text"
                                                    value={editForm.full_name}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Số điện thoại</label>
                                                <input
                                                    type="text"
                                                    value={editForm.phone_number}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
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
                                        <InfoRow label="Username" value={user.username} />
                                        <InfoRow label="Vai trò" value={ROLE_TEXT[user.role] || user.role} />
                                        <InfoRow label="Họ và tên" value={user.full_name} />
                                        <InfoRow label="Số điện thoại" value={user.phone_number} />
                                        <InfoRow label="Trạng thái" value={user.is_active ? "Đang hoạt động" : "Đã khóa"} />
                                        <InfoRow label="Ngày tạo" value={formatDateTime(user.created_at)} />
                                    </div>
                                )}
                            </div>

                            {user.role !== "admin" &&
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-4 text-base font-semibold text-slate-800">
                                        Đơn hàng đã phân công ({user.assigned_orders?.length ?? 0})
                                    </h2>

                                    {user.assigned_orders?.length === 0 ? (
                                        <p className="text-sm text-slate-500">Tài khoản này chưa được phân công đơn hàng nào.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mã đơn</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Loại phân công</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Khách hàng</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">SĐT</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng tiền</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày tạo</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {user.assigned_orders.map((order) => {
                                                        const statusInfo = STATUS_BADGE_CLASS[order.status] || "bg-slate-100 text-slate-700 border border-slate-200";
                                                        return (
                                                            <tr key={`${order.order_code}-${order.assignment_type}`} className="hover:bg-slate-50">
                                                                <td className="px-4 py-3 text-sm font-mono text-slate-700">{order.order_code}</td>
                                                                <td className="px-4 py-3 text-sm text-slate-700">{ASSIGNMENT_TEXT[order.assignment_type] || order.assignment_type || "-"}</td>
                                                                <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_full_name || "-"}</td>
                                                                <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_phone || "-"}</td>
                                                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{formatCurrency(order.total_amount)}</td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo}`}>
                                                                        {getStatusText(order.status)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(order.created_at)}</td>
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
                            }
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserDetailPage;
