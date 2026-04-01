import { useCallback, useEffect, useState } from "react";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import chatApi from "../../api/chatApi";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

const COLORS = ["#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#3b82f6"];

const StatCard = ({ icon, label, value, sub, color = "text-slate-800" }) => (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color} bg-slate-50`}>
            <i className={`fa-solid ${icon} text-lg`} />
        </span>
        <div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
            {sub ? <p className="text-[11px] text-slate-400">{sub}</p> : null}
        </div>
    </div>
);

const ChatDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await chatApi.getDashboardStats();
            setStats(res.data?.data || null);
        } catch {
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const ratingChartData = (stats?.ratingDistribution || []).map((r) => ({
        name: `${r.rating}★`,
        value: r.count
    }));

    const dailyData = (stats?.dailyMessages || []).map((d) => ({
        date: new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        "Khách hàng": d.customer,
        "Bot": d.bot,
        "Admin": d.admin
    }));

    const msgPieData = stats ? [
        { name: "Khách hàng", value: stats.customer_messages || 0 },
        { name: "Bot", value: stats.bot_messages || 0 },
        { name: "Admin", value: stats.admin_messages || 0 }
    ].filter((d) => d.value > 0) : [];

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-900">
            <SideBarMenu activePage="chat-stats" />
            <div className="flex-1">
                <AdminHeader
                    title="Thống kê Chatbot"
                    subtitle="Phân tích hiệu quả chatbot AI và hỗ trợ khách hàng"
                />

                <main className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <i className="fa-solid fa-spinner fa-spin text-2xl text-slate-400" />
                        </div>
                    ) : !stats ? (
                        <p className="text-sm text-slate-500 text-center py-20">Không thể tải dữ liệu thống kê.</p>
                    ) : (
                        <div className="space-y-6">
                            {/* Stat Cards */}
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <StatCard
                                    icon="fa-comments"
                                    label="Tổng hội thoại"
                                    value={stats.totalConversations}
                                    sub={`${stats.activeConversations} đang dùng bot`}
                                    color="text-sky-500"
                                />
                                <StatCard
                                    icon="fa-message"
                                    label="Tổng tin nhắn"
                                    value={stats.total_messages}
                                    sub={`Bot: ${stats.bot_messages} | Admin: ${stats.admin_messages}`}
                                    color="text-violet-500"
                                />
                                <StatCard
                                    icon="fa-star"
                                    label="Đánh giá TB"
                                    value={stats.avg_rating ? `${stats.avg_rating}/5` : "—"}
                                    sub={`${stats.total_ratings} lượt đánh giá`}
                                    color="text-amber-500"
                                />
                                <StatCard
                                    icon="fa-clock"
                                    label="Thời gian phản hồi TB"
                                    value={stats.avgResponseTimeSeconds ? `${stats.avgResponseTimeSeconds}s` : "—"}
                                    sub={`${stats.handoffCount} lần chuyển nhân viên`}
                                    color="text-emerald-500"
                                />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                {/* Daily Messages Bar Chart */}
                                <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 text-sm font-semibold text-slate-700">Tin nhắn theo ngày (30 ngày)</h3>
                                    {dailyData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={dailyData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 11 }} />
                                                <Tooltip />
                                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                                <Bar dataKey="Khách hàng" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="Bot" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="Admin" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-sm text-slate-400 text-center py-10">Chưa có dữ liệu</p>
                                    )}
                                </div>

                                {/* Message Distribution Pie */}
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 text-sm font-semibold text-slate-700">Phân bố tin nhắn</h3>
                                    {msgPieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie
                                                    data={msgPieData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={90}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {msgPieData.map((_, idx) => (
                                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-sm text-slate-400 text-center py-10">Chưa có dữ liệu</p>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Row */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {/* Rating Distribution */}
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 text-sm font-semibold text-slate-700">Phân bố đánh giá</h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-3xl font-bold text-amber-500">{stats.avg_rating || "—"}</span>
                                        <div>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <i key={s} className={`fa-solid fa-star text-sm ${s <= Math.round(stats.avg_rating || 0) ? "text-amber-400" : "text-slate-200"}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400">{stats.total_ratings} đánh giá</p>
                                        </div>
                                    </div>
                                    {ratingChartData.length > 0 ? (
                                        <div className="space-y-2">
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const item = ratingChartData.find((r) => r.name === `${star}★`);
                                                const count = item?.value || 0;
                                                const total = stats.total_ratings || 1;
                                                const pct = Math.round((count / total) * 100);
                                                return (
                                                    <div key={star} className="flex items-center gap-2 text-xs">
                                                        <span className="w-6 text-right text-slate-500">{star}★</span>
                                                        <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                                            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="w-8 text-right text-slate-400">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 text-center py-6">Chưa có đánh giá</p>
                                    )}
                                </div>

                                {/* Top Questions */}
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 text-sm font-semibold text-slate-700">Câu hỏi phổ biến (30 ngày)</h3>
                                    {stats.topQuestions?.length > 0 ? (
                                        <div className="space-y-2">
                                            {stats.topQuestions.map((q, idx) => (
                                                <div key={idx} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                                                        {idx + 1}
                                                    </span>
                                                    <p className="flex-1 text-xs text-slate-600 line-clamp-2">{q.text}</p>
                                                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-600">
                                                        {q.count}x
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 text-center py-6">Chưa có dữ liệu</p>
                                    )}
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                                    <p className="text-2xl font-bold text-green-600">{stats.positive_ratings || 0}</p>
                                    <p className="text-xs text-slate-500">Đánh giá tích cực (4-5★)</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                                    <p className="text-2xl font-bold text-red-500">{stats.negative_ratings || 0}</p>
                                    <p className="text-xs text-slate-500">Đánh giá tiêu cực (1-2★)</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                                    <p className="text-2xl font-bold text-violet-600">{stats.bot_messages || 0}</p>
                                    <p className="text-xs text-slate-500">Tin nhắn Bot xử lý</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                                    <p className="text-2xl font-bold text-amber-600">{stats.handoffCount || 0}</p>
                                    <p className="text-xs text-slate-500">Chuyển nhân viên</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ChatDashboard;
