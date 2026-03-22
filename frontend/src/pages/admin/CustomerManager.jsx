import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import customerApi from "../../api/customerApi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CustomerManager = () => {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [isActiveFilter, setIsActiveFilter] = useState("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");
    const [togglingId, setTogglingId] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        full_name: "",
        phone_number: "",
        email: "",
        password: ""
    });
    const navigate = useNavigate();

    const fetchCustomers = async () => {
        try {
            const response = await customerApi.getCustomers({
                search,
                isActive: isActiveFilter,
                sortBy,
                sortDir
            });
            setCustomers(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [search, isActiveFilter, sortBy, sortDir]);

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleDateString("vi-VN");
    };

    const handleToggleStatus = async (customer) => {
        if (togglingId) return;
        setTogglingId(customer.id);
        try {
            const res = await customerApi.toggleCustomerStatus(customer.id);
            const updated = res.data?.data;
            setCustomers((prev) =>
                prev.map((c) => (c.id === updated.id ? { ...c, is_active: updated.is_active } : c))
            );
            fetchCustomers();
        } catch (error) {
            console.error("Error toggling customer status:", error);
        } finally {
            setTogglingId(null);
        }
    };

    const resetCreateForm = () => {
        setCreateForm({
            full_name: "",
            phone_number: "",
            email: "",
            password: ""
        });
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();

        const payload = {
            full_name: createForm.full_name.trim(),
            phone_number: createForm.phone_number.trim(),
            email: createForm.email.trim(),
            password: createForm.password
        };

        if (!payload.full_name || !payload.phone_number || !payload.password) {
            alert("Vui lòng nhập đầy đủ họ tên, số điện thoại và mật khẩu.");
            return;
        }

        if (payload.password.length < 6) {
            alert("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        setCreating(true);
        try {
            await customerApi.create(payload);
            await fetchCustomers();

            setIsCreateOpen(false);
            resetCreateForm();
            alert("Thêm khách hàng thành công.");
        } catch (error) {
            const message = error?.response?.data?.message || "Không thể thêm khách hàng.";
            alert(message);
            console.error("Error creating customer:", error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="customers" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý khách hàng"
                    subtitle="Tra cứu thông tin tài khoản và lịch sử mua hàng của khách."
                />

                <main className="p-6">
                    <div className="mb-4 flex items-center justify-end">
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Thêm khách hàng
                        </button>
                    </div>

                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <input
                                type="text"
                                placeholder="Tìm khách hàng theo tên, số điện thoại, email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />

                            <select
                                value={isActiveFilter}
                                onChange={(e) => setIsActiveFilter(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="all">Trạng thái: Tất cả</option>
                                <option value="true">Đang hoạt động</option>
                                <option value="false">Đã khóa</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="created_at">Sắp xếp: Ngày tạo</option>
                                <option value="full_name">Sắp xếp: Họ tên</option>
                                <option value="phone_number">Sắp xếp: SĐT</option>
                            </select>

                            <select
                                value={sortDir}
                                onChange={(e) => setSortDir(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="desc">Giảm dần</option>
                                <option value="asc">Tăng dần</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Họ tên</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">SĐT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày tạo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {customers.map((customer, index) => (
                                        <tr key={customer.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{customer.full_name || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{customer.phone_number || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{customer.email || "-"}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${customer.is_active ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                    {customer.is_active ? "Đang hoạt động" : "Đã khóa"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{formatDate(customer.created_at)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                                    >
                                                        Chi tiết
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(customer)}
                                                        disabled={togglingId === customer.id}
                                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${customer.is_active
                                                            ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                            }`}
                                                    >
                                                        {togglingId === customer.id ? "..." : customer.is_active ? "Khóa" : "Mở khóa"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có khách hàng phù hợp.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                {isCreateOpen ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Thêm khách hàng mới</h2>
                                    <p className="mt-1 text-sm text-slate-500">Tạo tài khoản khách hàng từ trang quản trị.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        resetCreateForm();
                                    }}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm text-slate-500 hover:bg-slate-50"
                                >
                                    Đóng
                                </button>
                            </div>

                            <form onSubmit={handleCreateCustomer} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={createForm.full_name}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="Nhập họ tên khách hàng"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Số điện thoại</label>
                                    <input
                                        type="text"
                                        value={createForm.phone_number}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email (không bắt buộc)</label>
                                    <input
                                        type="email"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="Nhập email"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu</label>
                                    <input
                                        type="password"
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="Tối thiểu 6 ký tự"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateOpen(false);
                                            resetCreateForm();
                                        }}
                                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {creating ? "Đang tạo..." : "Tạo khách hàng"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default CustomerManager;