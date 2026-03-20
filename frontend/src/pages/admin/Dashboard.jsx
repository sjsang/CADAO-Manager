import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import orderApi from "../../api/orderApi";
import menuApi from "../../api/menuApi";
import customerApi from "../../api/customerApi";
import userApi from "../../api/userApi";

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [ordersRes, menuRes, customersRes, usersRes] = await Promise.all([
                    orderApi.getAllOrders(""),
                    menuApi.getAll(),
                    customerApi.getCustomers(),
                    userApi.getUsers()
                ]);

                setOrders(ordersRes.data?.data || []);
                setMenuItems(menuRes.data || []);
                setCustomers(customersRes.data?.data || []);
                setUsers(usersRes.data?.data || []);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchDashboard();
    }, []);

    const totalRevenue = useMemo(() => {
        return orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    }, [orders]);

    const pendingOrders = useMemo(() => {
        return orders.filter((order) => order.status === "pending").length;
    }, [orders]);

    const statCards = [
        {
            label: "Đơn hàng",
            value: orders.length,
            color: "text-blue-600"
        },
        {
            label: "Doanh thu tạm tính",
            value: `${totalRevenue.toLocaleString("vi-VN")}đ`,
            color: "text-emerald-600"
        },
        {
            label: "Khách hàng",
            value: customers.length,
            color: "text-violet-600"
        },
        {
            label: "Nhân sự hệ thống",
            value: users.length,
            color: "text-rose-600"
        },
        {
            label: "Món ăn",
            value: menuItems.length,
            color: "text-amber-600"
        },
        {
            label: "Đơn chờ xử lý",
            value: pendingOrders,
            color: "text-sky-600"
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="dashboard" />

            <div className="flex-1">
                <AdminHeader
                    title="Tổng quan hệ thống"
                    subtitle="Theo dõi nhanh hoạt động nhà hàng và hiệu suất vận hành."
                />

                <main className="p-6">
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {statCards.map((card) => (
                            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">{card.label}</p>
                                <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
                            </article>
                        ))}
                    </section>

                    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-800">Đơn hàng gần đây</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Mã đơn</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Khách hàng</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tổng tiền</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {orders.slice(0, 8).map((order, index) => (
                                        <tr key={`${order.order_code}-${index}`} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{order.order_code}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{order.delivery_full_name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{Number(order.total_amount || 0).toLocaleString("vi-VN")}đ</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{order.status}</td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Chưa có dữ liệu đơn hàng.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-600">
                            Gợi ý thao tác nhanh: chọn mục "Đơn hàng", "Thực đơn", "Khách hàng" hoặc "Nhân viên" ở thanh bên trái để quản lý chi tiết theo từng nghiệp vụ.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;