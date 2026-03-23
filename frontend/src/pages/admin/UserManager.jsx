import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import userApi from "../../api/userApi";
import TablePagination from "../../components/admin/TablePagination";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateDDMMYYYY } from "../../functions/formatDate";

const PAGE_SIZE = 8;

const buildCloudinaryUrl = (publicId) => {
    if (!publicId) return "";
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${publicId}`;
};

const ROLE_OPTIONS = [
    { value: "admin", label: "Admin" },
    { value: "shipper", label: "Shipper" }
];

const ROLE_BADGE = {
    admin: "border border-rose-200 bg-rose-50 text-rose-700",
    shipper: "border border-violet-200 bg-violet-50 text-violet-700"
};

const ROLE_TEXT = {
    admin: "Admin",
    shipper: "Shipper"
};

const UserManagerPage = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [isActiveFilter, setIsActiveFilter] = useState("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        username: "",
        full_name: "",
        phone_number: "",
        role: "shipper",
        password: ""
    });
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const response = await userApi.getUsers({
                search,
                role: roleFilter,
                isActive: isActiveFilter,
                sortBy,
                sortDir,
                page,
                limit: PAGE_SIZE
            });
            setUsers(response.data?.data || []);
            setPagination(response.data?.pagination || { page, limit: PAGE_SIZE, totalItems: (response.data?.data || []).length, totalPages: 1 });
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [search, roleFilter, isActiveFilter, sortBy, sortDir, page]);

    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, isActiveFilter, sortBy, sortDir]);

    const activeCount = useMemo(() => {
        return users.filter((user) => user.is_active).length;
    }, [users]);

    const lockedCount = Math.max(0, users.length - activeCount);

    const formatDate = (value) => {
        return formatDateDDMMYYYY(value);
    };

    const resetCreateForm = () => {
        setCreateForm({
            username: "",
            full_name: "",
            phone_number: "",
            role: "shipper",
            password: ""
        });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        const payload = {
            username: createForm.username.trim(),
            full_name: createForm.full_name.trim(),
            phone_number: createForm.phone_number.trim(),
            role: createForm.role,
            password: createForm.password
        };

        if (!payload.username || !payload.password || !payload.role) {
            alert("Vui lòng nhập username, mật khẩu và vai trò.");
            return;
        }

        if (payload.password.length < 6) {
            alert("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        setCreating(true);

        try {
            await userApi.create(payload);
            await fetchUsers();
            setIsCreateOpen(false);
            resetCreateForm();
            alert("Thêm tài khoản thành công.");
        } catch (error) {
            console.error("Error creating user:", error);
            alert(error?.response?.data?.message || "Không thể thêm tài khoản.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="users" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý tài khoản"
                    subtitle="Phân quyền và theo dõi tài khoản admin, shipper."
                />

                <main className="p-6">
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <input
                                type="text"
                                placeholder="Tìm tài khoản theo username, tên, vai trò..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 min-w-55 rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />

                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="all">Vai trò: Tất cả</option>
                                <option value="admin">Admin</option>
                                <option value="shipper">Shipper</option>
                            </select>

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
                                <option value="username">Sắp xếp: Username</option>
                                <option value="full_name">Sắp xếp: Họ tên</option>
                                <option value="role">Sắp xếp: Vai trò</option>
                            </select>

                            <select
                                value={sortDir}
                                onChange={(e) => setSortDir(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="desc">Giảm dần</option>
                                <option value="asc">Tăng dần</option>
                            </select>

                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Thêm tài khoản
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700">
                                Tổng tài khoản: <strong>{pagination.totalItems}</strong>
                            </span>
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                                Đang hoạt động: <strong>{activeCount}</strong>
                            </span>
                            <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-rose-700">
                                Đã khóa: <strong>{lockedCount}</strong>
                            </span>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ảnh</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Username</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Họ tên</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">SĐT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Vai trò</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày tạo</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {users.map((user, index) => (
                                        <tr
                                            key={user.id}
                                            className="cursor-pointer hover:bg-slate-50"
                                            onClick={() => navigate(`/admin/users/${user.id}`)}
                                        >
                                            <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-300 bg-slate-100">
                                                    {user.avatar_url ? (
                                                        <img
                                                            src={buildCloudinaryUrl(user.avatar_url)}
                                                            alt="Avatar tài khoản"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">─</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{user.username}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{user.full_name || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{user.phone_number || "-"}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[user.role] || "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                                                    {ROLE_TEXT[user.role] || user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                    {user.is_active ? "Đang hoạt động" : "Đã khóa"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{formatDate(user.created_at)}</td>
                                        </tr>
                                    ))}

                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có dữ liệu tài khoản phù hợp.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>

                        <TablePagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            totalItems={pagination.totalItems}
                            onPageChange={setPage}
                        />
                    </div>
                </main>

                {isCreateOpen ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Thêm tài khoản mới</h2>
                                    <p className="mt-1 text-sm text-slate-500">Tạo tài khoản admin hoặc shipper từ trang quản trị.</p>
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

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Username</label>
                                    <input
                                        type="text"
                                        value={createForm.username}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="Nhập username"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={createForm.full_name}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="Nhập họ tên"
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
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Vai trò</label>
                                    <select
                                        value={createForm.role}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        {ROLE_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
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
                                        {creating ? "Đang tạo..." : "Tạo tài khoản"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default UserManagerPage;
