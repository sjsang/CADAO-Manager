import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dashboardApi from "../../api/dashboardApi";
import { getStatusText } from "../../functions/formatOrderFields";
import { notifyCustomer } from "../../utils/customerNotify";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatDayLabel = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "--/--";
    }

    return date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
};

const formatDateTime = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${hour}:${minute} ${day}/${month}`;
};

const formatLiveElapsed = (fromValue, nowMs = Date.now()) => {
    const fromMs = new Date(fromValue).getTime();

    if (Number.isNaN(fromMs)) {
        return "-";
    }

    const diff = Math.max(0, nowMs - fromMs);
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");

    if (days > 0) {
        return `${days}d ${hh}:${mm}:${ss}`;
    }

    return `${hh}:${mm}:${ss}`;
};

const statusClasses = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    confirmed: "bg-sky-50 text-sky-700 border border-sky-200",
    preparing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    shipping: "bg-violet-50 text-violet-700 border border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border border-rose-200"
};

const chartPalette = ["#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1"];

const ChartTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
            {label ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{labelFormatter ? labelFormatter(label) : label}</p> : null}
            <div className="mt-2 space-y-1.5">
                {payload.map((entry) => (
                    <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 text-slate-500">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                        </span>
                        <span className="font-semibold text-slate-900">{formatter ? formatter(entry.value, entry.name, entry) : entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [nowTs, setNowTs] = useState(Date.now());

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await dashboardApi.getOverview();
                setOverview(response.data?.data || null);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowTs(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const weeklyRevenue = overview?.weeklyRevenue || [];
    const recentOrders = overview?.recentOrders || [];
    const processingOrders = overview?.processingOrders || [];
    const recentReviews = overview?.recentReviews || [];
    const topSellingItems = overview?.topSellingItems || [];
    const summary = overview?.summary || {
        revenueToday: 0,
        ordersToday: 0,
        activeOrders: 0,
        completedOrders: 0,
        averageRating: 0
    };

    const weekTotalRevenue = useMemo(() => {
        return weeklyRevenue.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    }, [weeklyRevenue]);

    const revenueChartData = useMemo(() => (
        weeklyRevenue.map((item) => ({
            label: formatDayLabel(item.date),
            revenue: Number(item.revenue || 0)
        }))
    ), [weeklyRevenue]);

    const topSellingChartData = useMemo(() => (
        topSellingItems.map((item) => ({
            name: item.name,
            soldQuantity: Number(item.sold_quantity || 0),
            revenue: Number(item.revenue || 0)
        }))
    ), [topSellingItems]);

    const statusPieData = useMemo(() => {
        const completed = Number(summary.completedOrders || 0);
        const active = Number(summary.activeOrders || 0);
        const rated = Number(recentReviews.length || 0);

        return [
            { name: "Hoàn thành", value: completed },
            { name: "Đang vận hành", value: active },
            { name: "Đánh giá mới", value: rated }
        ].filter((item) => item.value > 0);
    }, [summary, recentReviews.length]);

    const processingOrdersDisplay = useMemo(() => {
        if (processingOrders.length > 0) {
            return processingOrders;
        }

        return recentOrders.filter((order) => ["pending", "confirmed", "preparing", "shipping"].includes(order.status));
    }, [processingOrders, recentOrders]);

    const statCards = [
        {
            label: "Doanh thu hôm nay",
            value: formatCurrency(summary.revenueToday),
            hint: `${summary.ordersToday} đơn phát sinh trong ngày`,
            panelClass: "border-emerald-200 bg-emerald-50/70",
            valueClass: "text-emerald-700"
        },
        {
            label: "Đơn đang xử lý",
            value: summary.activeOrders,
            hint: "Chờ xác nhận, đã xác nhận, chuẩn bị và đang giao",
            panelClass: "border-sky-200 bg-sky-50/70",
            valueClass: "text-sky-700"
        },
        {
            label: "Đơn hoàn thành",
            value: summary.completedOrders,
            hint: `Doanh thu 7 ngày: ${formatCurrency(weekTotalRevenue)}`,
            panelClass: "border-violet-200 bg-violet-50/70",
            valueClass: "text-violet-700"
        },
        {
            label: "Điểm đánh giá trung bình",
            value: `${summary.averageRating.toFixed(1)}/5`,
            hint: `${recentReviews.length} đánh giá mới nhất đang hiển thị`,
            panelClass: "border-amber-200 bg-amber-50/70",
            valueClass: "text-amber-700"
        }
    ];

    if (loading) {
        return (
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="dashboard" />
                <div className="flex-1">
                    <AdminHeader
                        title="Tổng quan hệ thống"
                        subtitle="Đang tải dữ liệu vận hành để dựng dashboard."
                    />
                    <main className="p-6">
                        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="h-5 w-52 animate-pulse rounded bg-slate-200" />
                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="dashboard" />

            <div className="flex-1">
                <AdminHeader
                    title="Dashboard vận hành"
                    subtitle="Nhìn nhanh doanh thu hôm nay, nhịp đơn hàng và tín hiệu từ khách hàng trong một màn hình."
                />

                <main className="space-y-6 p-6">
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {statCards.map((card) => (
                            <article key={card.label} className={`rounded-3xl border p-5 shadow-sm ${card.panelClass}`}>
                                <p className="text-sm font-medium text-slate-600">{card.label}</p>
                                <p className={`mt-3 text-3xl font-bold ${card.valueClass}`}>{card.value}</p>
                                <p className="mt-3 text-sm leading-6 text-slate-500">{card.hint}</p>
                            </article>
                        ))}
                    </section>

                    <section>
                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Processing Orders</p>
                                    <h3 className="mt-1 text-xl font-semibold text-slate-900">Đơn đang xử lý</h3>
                                </div>
                                <button
                                    onClick={() => navigate("/admin/orders")}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Mở quản lý đơn
                                </button>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                {processingOrdersDisplay.length > 0 ? (
                                    processingOrdersDisplay.map((order) => (
                                        <article
                                            key={order.order_code}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                                            onClick={() => navigate(`/admin/orders/${order.order_code}`)}
                                            title="Mở chi tiết đơn để thao tác"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Mã đơn</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-900">{order.order_code}</p>
                                                </div>
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status] || "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-xs uppercase tracking-wide text-slate-400">Khách hàng</p>
                                                    <p className="mt-1 text-sm font-medium text-slate-700">{order.delivery_full_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-wide text-slate-400">SĐT</p>
                                                    <p className="mt-1 text-sm font-medium text-slate-700">{order.delivery_phone || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-wide text-slate-400">Tổng tiền</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(order.total_amount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-wide text-slate-400">Đang xử lý</p>
                                                    <p className="mt-1 text-sm font-semibold text-blue-700">{formatLiveElapsed(order.created_at, nowTs)}</p>
                                                </div>
                                            </div>

                                        </article>
                                    ))
                                ) : (
                                    <div className="md:col-span-2 2xl:col-span-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                        Hiện chưa có đơn đang xử lý.
                                    </div>
                                )}
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Biểu đồ tuần</p>
                                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Doanh thu 7 ngày gần nhất</h3>
                                </div>
                                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tổng tuần</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(weekTotalRevenue)}</p>
                                </div>
                            </div>

                            <div className="mt-6 h-80">
                                {revenueChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueChartData} barGap={10}>
                                            <defs>
                                                <linearGradient id="dashboardRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#34d399" />
                                                    <stop offset="100%" stopColor="#059669" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                                            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                                            <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
                                            <Bar dataKey="revenue" name="Doanh thu" fill="url(#dashboardRevenueGradient)" radius={[14, 14, 6, 6]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                                        Chưa có dữ liệu doanh thu trong tuần.
                                    </div>
                                )}
                            </div>
                        </article>

                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Top bán chạy</p>
                                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Món đang kéo doanh thu</h3>
                                </div>
                                <button
                                    onClick={() => navigate("/admin/menus")}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Xem thực đơn
                                </button>
                            </div>

                            <div className="mt-6 h-80">
                                {topSellingChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topSellingChartData} layout="vertical" margin={{ left: 16, right: 12 }}>
                                            <defs>
                                                <linearGradient id="dashboardTopSellingGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#a78bfa" />
                                                    <stop offset="100%" stopColor="#d946ef" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" horizontal={false} />
                                            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#334155", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<ChartTooltip formatter={(value, name) => name === "Doanh thu" ? formatCurrency(value) : `${value} phần`} />} />
                                            <Bar dataKey="soldQuantity" name="Số lượng bán" radius={[0, 14, 14, 0]} fill="url(#dashboardTopSellingGradient)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                                        Chưa đủ dữ liệu để xếp hạng món bán chạy.
                                    </div>
                                )}
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.95fr]">
                        <article className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Recent Orders</p>
                                    <h3 className="mt-1 text-xl font-semibold text-slate-900">Đơn hàng gần đây</h3>
                                </div>
                                <button
                                    onClick={() => navigate("/admin/orders")}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Xem tất cả
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mã đơn</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Khách hàng</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng tiền</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {recentOrders.length > 0 ? (
                                            recentOrders.map((order) => (
                                                <tr key={order.order_code} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{order.order_code}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-700">{order.delivery_full_name}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{formatCurrency(order.total_amount)}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status] || "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                                                            {getStatusText(order.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(order.created_at)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                                                    Chưa có đơn hàng gần đây.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </article>

                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Recent Reviews</p>
                                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Đánh giá mới từ khách hàng</h3>
                                </div>
                                <button
                                    onClick={() => navigate("/admin/reviews")}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Quản lý đánh giá
                                </button>
                            </div>

                            <div className="mt-6 space-y-4">
                                {recentReviews.length > 0 ? (
                                    recentReviews.map((review) => (
                                        <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-900">{review.customer_name}</h4>
                                                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{review.order_code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-amber-500">{"★".repeat(Math.round(Number(review.rating || 0)))}<span className="text-slate-300">{"★".repeat(Math.max(0, 5 - Math.round(Number(review.rating || 0))))}</span></p>
                                                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(review.created_at)}</p>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">{review.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                        Chưa có đánh giá mới để hiển thị.
                                    </div>
                                )}
                            </div>
                        </article>
                    </section>

                </main>
            </div>
        </div>
    );
};

export default Dashboard;