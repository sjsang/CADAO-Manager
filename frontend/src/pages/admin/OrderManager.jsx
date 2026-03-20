import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import orderApi from "../../api/orderApi";
import { useEffect, useMemo, useState } from "react";

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await orderApi.getAllOrders(search);
                if (response.data.success) {
                    setOrders(response.data.data);
                } else {
                    console.error("Failed to fetch orders:", response.data.message);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };

        fetchOrders();
    }, [search]);

    const displayedOrders = useMemo(() => {
        if (statusFilter === "all") {
            return orders;
        }

        return orders.filter((order) => order.status === statusFilter);
    }, [orders, statusFilter]);

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

                <div className="min-h-full p-6">
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
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="shipping">Shipping</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
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
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tổng tiền</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {displayedOrders.map((order, index) => (
                                        <tr key={`${order.order_code}-${index}`} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{order.order_code}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_full_name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_phone || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_address || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{Number(order.total_amount || 0).toLocaleString("vi-VN")}đ</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {displayedOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có đơn hàng phù hợp bộ lọc.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderManager;