import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import customerApi from "../../api/customerApi";
import chatApi from "../../api/chatApi";
import TablePagination from "../../components/admin/TablePagination";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateDDMMYYYY } from "../../functions/formatDate";

const PAGE_SIZE = 8;

const buildCloudinaryUrl = (publicId) => {
    if (!publicId) return "";
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${publicId}`;
};

const CustomerManager = () => {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [isActiveFilter, setIsActiveFilter] = useState("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
    const navigate = useNavigate();

    const fetchCustomers = async () => {
        try {
            const response = await customerApi.getCustomers({
                search,
                isActive: isActiveFilter,
                sortBy,
                sortDir,
                page,
                limit: PAGE_SIZE
            });
            setCustomers(response.data?.data || []);
            setPagination(response.data?.pagination || { page, limit: PAGE_SIZE, totalItems: (response.data?.data || []).length, totalPages: 1 });
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [search, isActiveFilter, sortBy, sortDir, page]);

    useEffect(() => {
        setPage(1);
    }, [search, isActiveFilter, sortBy, sortDir]);

    const formatDate = (value) => {
        return formatDateDDMMYYYY(value);
    };

    const handleStartChat = async (e, customerId) => {
        e.stopPropagation();
        try {
            const response = await chatApi.startConversationByAdmin(customerId);
            const conversation = response.data?.data;
            if (conversation?.id) {
                navigate(`/admin/chats?conversationId=${conversation.id}`);
            }
        } catch (error) {
            console.error("Failed to start chat:", error);
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
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <input
                                type="text"
                                placeholder="Tìm khách hàng theo tên, số điện thoại, email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 min-w-55 rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
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

                            <button
                                onClick={() => navigate("/admin/customers/add")}
                                className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Thêm khách hàng
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ảnh</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Họ tên</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">SĐT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày tạo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {customers.map((customer, index) => (
                                        <tr
                                            key={customer.id}
                                            className="cursor-pointer hover:bg-slate-50"
                                            onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                        >
                                            <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-300 bg-slate-100">
                                                    {customer.avatar_url ? (
                                                        <img
                                                            src={buildCloudinaryUrl(customer.avatar_url)}
                                                            alt="Avatar khách hàng"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">─</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{customer.full_name || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{customer.phone_number || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{customer.email || "-"}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${customer.is_active ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                    {customer.is_active ? "Đang hoạt động" : "Đã khóa"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{formatDate(customer.created_at)}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleStartChat(e, customer.id)}
                                                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                                    title="Gửi tin nhắn"
                                                >
                                                    Nhắn tin
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có khách hàng phù hợp.
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
            </div>
        </div>
    );
}

export default CustomerManager;