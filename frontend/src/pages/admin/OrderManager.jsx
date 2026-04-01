import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import orderApi from "../../api/orderApi";
import { getStatusText } from "../../functions/formatOrderFields";
import TablePagination from "../../components/admin/TablePagination";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateDDMMYYYY, formatElapsedTime } from "../../functions/formatDate";
import { useSocket } from "../../contexts/SocketContext";

const PAGE_SIZE = 10;

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

const OrderManager = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [nowTs, setNowTs] = useState(Date.now());
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });

    const fetchOrders = useCallback(async () => {
        try {
            const response = await orderApi.getAllOrders({
                search,
                status: statusFilter,
                sortBy,
                sortDir,
                page,
                limit: PAGE_SIZE
            });
            if (response.data.success) {
                setOrders(response.data.data);
                setPagination(response.data.pagination || { page, limit: PAGE_SIZE, totalItems: response.data.data.length, totalPages: 1 });
            } else {
                console.error("Failed to fetch orders:", response.data.message);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    }, [search, statusFilter, sortBy, sortDir, page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, sortBy, sortDir]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowTs(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    // Socket: nhận đơn hàng mới + cập nhật trạng thái
    useEffect(() => {
        if (!socket) return;

        const handleRefresh = () => fetchOrders();

        socket.on("order:new", handleRefresh);
        socket.on("order:statusUpdated", handleRefresh);

        return () => {
            socket.off("order:new", handleRefresh);
            socket.off("order:statusUpdated", handleRefresh);
        };
    }, [socket, fetchOrders]);

    const getProcessingDuration = (order) => {
        const isFinished = order.status === "completed" || order.status === "cancelled";
        const endTime = isFinished ? (order.updated_at || order.created_at) : nowTs;
        return formatElapsedTime(order.created_at, endTime);
    };

    const statusClass = (status) => {
        const map = {
            pending: "bg-amber-50 text-amber-700 border border-amber-200",
            confirmed: "bg-sky-50 text-sky-700 border border-sky-200",
            preparing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
            shipping: "bg-violet-50 text-violet-700 border border-violet-200",
            completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            cancelled: "bg-rose-50 text-rose-700 border border-rose-200"
        };

        return map[status] || "bg-slate-100 text-slate-700 border border-slate-200";
    };

    return (
        <div className="flex min-h-screen bg-slate-100">

            <SideBarMenu activePage="orders" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý đơn hàng"
                    subtitle="Theo dõi trạng thái xử lý và thông tin giao nhận theo thời gian thực."
                />

                <div className="p-6">
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <input
                                type="text"
                                placeholder="Tìm đơn hàng..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Chờ xác nhận</option>
                                <option value="confirmed">Đã xác nhận</option>
                                <option value="preparing">Đang chuẩn bị</option>
                                <option value="shipping">Đang giao hàng</option>
                                <option value="completed">Đã hoàn thành</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="created_at">Sắp xếp: Ngày tạo</option>
                                <option value="total_amount">Sắp xếp: Tổng tiền</option>
                                <option value="delivery_full_name">Sắp xếp: Khách hàng</option>
                            </select>

                            <select
                                value={sortDir}
                                onChange={(e) => setSortDir(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="desc">Mới nhất / Giảm dần</option>
                                <option value="asc">Cũ nhất / Tăng dần</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Mã đơn</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Khách hàng</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">SĐT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Địa chỉ</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Thời gian tạo đơn</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tổng tiền</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {orders.map((order, index) => (
                                        <tr
                                            key={`${order.order_code}-${index}`}
                                            className="cursor-pointer hover:bg-slate-50"
                                            onClick={() => navigate(`/admin/orders/${order.order_code}`)}
                                        >
                                            <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{order.order_code}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_full_name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_phone || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_address || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(order.created_at)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{Number(order.total_amount || 0).toLocaleString("vi-VN")}đ</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(order.status)}`}>
                                                        {getStatusText(order.status)}
                                                    </span>
                                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                                        {getProcessingDuration(order)}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có đơn hàng phù hợp bộ lọc.
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

                </div>
            </div>
        </div>
    );
}

export default OrderManager;