import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import dashboardApi from "../../api/dashboardApi";
import { getPaymentMethodText, getStatusText } from "../../functions/formatOrderFields";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

const PRESETS = [
    { key: "yesterday", label: "Hôm qua" },
    { key: "today", label: "Hôm nay" },
    { key: "month", label: "Tháng này" },
    { key: "custom", label: "Tùy chọn" }
];

const TABS = [
    { key: "overview", label: "Tổng quan", icon: "fa-solid fa-chart-pie" },
    { key: "orders", label: "Đơn hàng", icon: "fa-solid fa-receipt" },
    { key: "menu", label: "Thực đơn", icon: "fa-solid fa-utensils" },
    { key: "customers", label: "Khách hàng", icon: "fa-solid fa-users" },
    { key: "reviews", label: "Đánh giá", icon: "fa-solid fa-star" },
    { key: "vouchers", label: "Voucher & KM", icon: "fa-solid fa-ticket" },
    { key: "areas", label: "Khu vực", icon: "fa-solid fa-map-location-dot" },
    { key: "staff", label: "Nhân sự", icon: "fa-solid fa-user-tie" }
];

const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "preparing", label: "Đang chuẩn bị" },
    { value: "shipping", label: "Đang giao" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" }
];

const GROUP_BY_OPTIONS = [
    { value: "day", label: "Theo ngày" },
    { value: "week", label: "Theo tuần" }
];

const statusClasses = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    confirmed: "bg-sky-50 text-sky-700 border border-sky-200",
    preparing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    shipping: "bg-violet-50 text-violet-700 border border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border border-rose-200"
};

const statusGradientByKey = {
    pending: ["#fbbf24", "#f59e0b"],
    confirmed: ["#38bdf8", "#0284c7"],
    preparing: ["#a78bfa", "#7c3aed"],
    shipping: ["#c4b5fd", "#7c3aed"],
    completed: ["#34d399", "#059669"],
    cancelled: ["#fb7185", "#e11d48"]
};

const gradientPairs = [
    ["#06b6d4", "#2563eb"],
    ["#34d399", "#059669"],
    ["#a78bfa", "#7c3aed"],
    ["#fbbf24", "#f97316"],
    ["#fb7185", "#e11d48"],
    ["#60a5fa", "#4f46e5"],
    ["#2dd4bf", "#0d9488"]
];

const alertToneClasses = {
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
    good: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const createPresetFilters = (preset) => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    if (preset === "yesterday") {
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
    } else if (preset === "today") {
        // start = end = today
    } else if (preset === "month") {
        start.setDate(1);
    } else {
        start.setDate(today.getDate() - 29);
    }

    return {
        preset,
        fromDate: toDateInputValue(start),
        toDate: toDateInputValue(end),
        status: "all",
        groupBy: "day",
        topLimit: 10
    };
};

const formatPeriodLabel = (value, groupBy) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    if (groupBy === "week") {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `Tuần ${day}/${month}`;
    }
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const getPaymentStatusText = (status) => {
    switch (status) {
        case "pending": return "Chờ thanh toán";
        case "paid": return "Đã thanh toán";
        case "failed": return "Thất bại";
        case "refunded": return "Đã hoàn tiền";
        default: return status;
    }
};

const formatDateForReport = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || "-";
    return date.toLocaleDateString("vi-VN");
};

const getReportTitleByFilters = ({ fromDate, toDate }) => {
    if (!fromDate || !toDate) return "Bao cao thong ke";
    if (fromDate === toDate) return `Bao cao ngay ${formatDateForReport(fromDate)}`;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const monthLastDate = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
    const isFullMonth = from.getFullYear() === to.getFullYear()
        && from.getMonth() === to.getMonth()
        && from.getDate() === 1
        && to.getDate() === monthLastDate;
    if (isFullMonth) return `Bao cao thang ${String(from.getMonth() + 1).padStart(2, "0")}/${from.getFullYear()}`;
    return `Bao cao tu ${formatDateForReport(fromDate)} den ${formatDateForReport(toDate)}`;
};

/* ─── Shared UI Components ─── */

const SummaryCard = ({ label, value, hint, tone, icon }) => (
    <article className={`rounded-3xl border p-5 shadow-sm ${tone}`}>
        <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            {icon ? <i className={`${icon} text-lg opacity-40`} /> : null}
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
        {hint ? <p className="mt-3 text-sm leading-6 text-slate-500">{hint}</p> : null}
    </article>
);

const ChartTooltip = ({ active, payload, label, formatter, labelFormatter, nameFormatter }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
            {label ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{labelFormatter ? labelFormatter(label) : label}</p> : null}
            <div className="mt-2 space-y-1.5">
                {payload.map((entry) => (
                    <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 text-slate-500">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            {nameFormatter ? nameFormatter(entry.name, entry) : entry.name}
                        </span>
                        <span className="font-semibold text-slate-900">{formatter ? formatter(entry.value, entry.name, entry) : entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SectionCard = ({ tag, title, children, className = "" }) => (
    <article className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
        {tag || title ? (
            <div className="mb-6">
                {tag ? <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{tag}</p> : null}
                {title ? <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3> : null}
            </div>
        ) : null}
        {children}
    </article>
);

const EmptyState = ({ message }) => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        {message}
    </div>
);

const SkeletonBlock = ({ className = "h-64" }) => (
    <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />
);

const renderStatusPieLabel = ({ percent, x, y }) => {
    if (!percent || percent < 0.06) return null;
    return (
        <text x={x} y={y} fill="#0f172a" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
            {`${Math.round(percent * 100)}%`}
        </text>
    );
};

/* ─── Tab: Tổng quan ─── */
const OverviewTab = ({ loading, trendChartData, trendRevenue, statusMixDisplay, summary, alerts }) => (
    <div className="space-y-6">
        <SectionCard tag="Revenue & Volume" title="Xu hướng doanh thu và số đơn">
            <div className="flex flex-wrap items-start justify-between gap-3 -mt-6 mb-6">
                <div />
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tổng doanh thu</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(trendRevenue)}</p>
                </div>
            </div>
            <div className="h-80">
                {loading ? <SkeletonBlock className="h-80" /> : trendChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendChartData}>
                            <defs>
                                <linearGradient id="statsOrdersGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#38bdf8" />
                                    <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                                <linearGradient id="statsRevenueGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                            <Tooltip content={<ChartTooltip formatter={(v, name) => name === "Doanh thu" ? formatCurrency(v) : `${v} đơn`} />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar yAxisId="left" dataKey="orderCount" name="Tổng đơn" fill="url(#statsOrdersGradient)" radius={[10, 10, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu" stroke="url(#statsRevenueGradient)" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#059669", strokeWidth: 0 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : <EmptyState message="Chưa có dữ liệu xu hướng trong khoảng thời gian đã chọn." />}
            </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard tag="Status Mix" title="Cơ cấu trạng thái đơn hàng">
                <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
                    {loading ? (
                        <>
                            <SkeletonBlock className="h-56" />
                            <SkeletonBlock className="h-56" />
                        </>
                    ) : statusMixDisplay.length > 0 ? (
                        <>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <defs>
                                            {statusMixDisplay.map((item) => (
                                                <linearGradient key={`sg-${item.status}`} id={`sg-${item.status}`} x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor={(statusGradientByKey[item.status] || gradientPairs[0])[0]} />
                                                    <stop offset="100%" stopColor={(statusGradientByKey[item.status] || gradientPairs[0])[1]} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <Pie data={statusMixDisplay} dataKey="count" nameKey="status" innerRadius={58} outerRadius={94} paddingAngle={3} labelLine={false} label={renderStatusPieLabel}>
                                            {statusMixDisplay.map((entry) => (
                                                <Cell key={entry.status} fill={`url(#sg-${entry.status})`} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip formatter={(v) => `${v} đơn`} labelFormatter={getStatusText} nameFormatter={getStatusText} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                                {statusMixDisplay.map((item) => (
                                    <div key={item.status} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[item.status] || "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                                                {getStatusText(item.status)}
                                            </span>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">{item.count} đơn</p>
                                                <p className="text-xs text-slate-500">{item.percent.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                            <div className="h-full rounded-full bg-linear-to-r from-slate-700 to-slate-900" style={{ width: `${item.percent}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <div className="xl:col-span-2"><EmptyState message="Không có dữ liệu trạng thái phù hợp bộ lọc." /></div>}
                </div>
            </SectionCard>

            <SectionCard tag="Operation Alerts" title="Cảnh báo vận hành">
                <div className="space-y-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-20" />)
                    ) : alerts.length > 0 ? (
                        alerts.map((item) => (
                            <div key={item.code} className={`rounded-2xl border px-4 py-4 ${alertToneClasses[item.level] || "border-slate-200 bg-slate-50 text-slate-700"}`}>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em]">{item.level === "warning" ? "Cảnh báo" : item.level === "info" ? "Thông tin" : "Tốt"}</p>
                                <p className="mt-2 text-sm leading-6">{item.message}</p>
                            </div>
                        ))
                    ) : <EmptyState message="Không có cảnh báo nào trong phạm vi lọc." />}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Giá trị TB / đơn</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.averageOrderValue)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Đơn đang xử lý</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.activeOrders}</p>
                    </div>
                </div>
            </SectionCard>
        </div>
    </div>
);

/* ─── Tab: Đơn hàng ─── */
const OrdersTab = ({ loading, summary, statusMixDisplay, paymentChartData, paymentBreakdown, paymentStatusChartData, fulfillmentMetrics }) => (
    <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Tổng đơn phát sinh" value={summary.totalOrders} hint={`${summary.activeOrders} đang xử lý`} tone="border-sky-200 bg-sky-50/70" icon="fa-solid fa-receipt" />
            <SummaryCard label="Hoàn thành" value={summary.completedOrders} hint={`Tỷ lệ ${summary.completionRate}%`} tone="border-emerald-200 bg-emerald-50/70" icon="fa-solid fa-circle-check" />
            <SummaryCard label="Đã hủy" value={summary.cancelledOrders} hint={`Tỷ lệ ${summary.cancellationRate}%`} tone="border-rose-200 bg-rose-50/70" icon="fa-solid fa-circle-xmark" />
            <SummaryCard label="Giá trị TB / đơn" value={formatCurrency(summary.averageOrderValue)} tone="border-violet-200 bg-violet-50/70" icon="fa-solid fa-coins" />
        </div>

        <SectionCard tag="Phân bổ trạng thái" title="Chi tiết trạng thái đơn hàng">
            {loading ? <SkeletonBlock /> : statusMixDisplay.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th className="py-3 pl-4">Trạng thái</th>
                                <th className="py-3 text-right">Số đơn</th>
                                <th className="py-3 pr-4 text-right">Tỷ lệ</th>
                                <th className="py-3 pr-4 w-48"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {statusMixDisplay.map((item) => (
                                <tr key={item.status} className="border-b border-slate-100 last:border-0">
                                    <td className="py-3 pl-4">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[item.status] || "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                                            {getStatusText(item.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-semibold text-slate-900">{item.count}</td>
                                    <td className="py-3 pr-4 text-right text-slate-600">{item.percent.toFixed(1)}%</td>
                                    <td className="py-3 pr-4">
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full rounded-full bg-linear-to-r from-slate-600 to-slate-800" style={{ width: `${item.percent}%` }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <EmptyState message="Không có dữ liệu trạng thái." />}
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard tag="Fulfillment" title="Thời gian hoàn tất đơn">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">TG hoàn tất trung bình</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{Math.round(fulfillmentMetrics.avgFulfillmentMinutes)} <span className="text-lg font-medium text-slate-500">phút</span></p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">TG hoàn tất trung vị</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{Math.round(fulfillmentMetrics.medianFulfillmentMinutes)} <span className="text-lg font-medium text-slate-500">phút</span></p>
                    </div>
                </div>
            </SectionCard>

            <SectionCard tag="Payment Status" title="Trạng thái thanh toán">
                {loading ? <SkeletonBlock className="h-52" /> : paymentStatusChartData.length > 0 ? (
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paymentStatusChartData}>
                                <defs>
                                    <linearGradient id="payStatusGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#818cf8" />
                                        <stop offset="100%" stopColor="#4338ca" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip formatter={(v) => `${v} đơn`} />} />
                                <Bar dataKey="count" name="Số đơn" fill="url(#payStatusGrad)" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : <EmptyState message="Chưa có dữ liệu trạng thái thanh toán." />}
            </SectionCard>
        </div>

        <SectionCard tag="Payment Methods" title="Phương thức thanh toán">
            {loading ? <SkeletonBlock /> : paymentBreakdown.length > 0 ? (
                <div className="grid gap-5">
                    <div className="h-72 rounded-3xl bg-slate-50/60 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paymentChartData}>
                                <defs>
                                    <linearGradient id="payMethodGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#c084fc" />
                                        <stop offset="100%" stopColor="#7c3aed" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip formatter={(v, name) => name === "Doanh thu" ? formatCurrency(v) : `${v} đơn`} />} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="orderCount" name="Số đơn" fill="url(#payMethodGrad)" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {paymentBreakdown.map((item) => (
                            <div key={item.method} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{getPaymentMethodText(item.method)}</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.orderCount} <span className="text-sm font-normal text-slate-500">đơn</span></p>
                                <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.revenue)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : <EmptyState message="Chưa có dữ liệu thanh toán." />}
        </SectionCard>
    </div>
);

/* ─── Tab: Thực đơn ─── */
const MenuTab = ({ loading, menuMetrics, topItems, topItemTotal, categoryChartData, topItemsChartData }) => {
    const menuActiveRate = menuMetrics.totalItems > 0 ? ((menuMetrics.activeItems / menuMetrics.totalItems) * 100).toFixed(1) : "0.0";

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Món đang kinh doanh" value={`${menuMetrics.activeItems}/${menuMetrics.totalItems}`} hint={`Tỷ lệ active ${menuActiveRate}%`} tone="border-emerald-200 bg-emerald-50/70" icon="fa-solid fa-circle-check" />
                <SummaryCard label="Món tạm ngưng" value={menuMetrics.inactiveItems} tone="border-amber-200 bg-amber-50/70" icon="fa-solid fa-pause-circle" />
                <SummaryCard label="Sản lượng bán" value={menuMetrics.soldQuantity} hint="Tổng phần bán ra trong kỳ" tone="border-sky-200 bg-sky-50/70" icon="fa-solid fa-fire" />
                <SummaryCard label="Số danh mục" value={categoryChartData.length} tone="border-violet-200 bg-violet-50/70" icon="fa-solid fa-layer-group" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard tag="Top Items" title="Món bán chạy nhất">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-20 mb-3" />)
                    ) : topItems.length > 0 ? (
                        <div className="space-y-3">
                            {topItems.map((item, index) => {
                                const share = topItemTotal > 0 ? (Number(item.sold_quantity || 0) / topItemTotal) * 100 : 0;
                                return (
                                    <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{index + 1}</span>
                                                <h4 className="text-sm font-semibold text-slate-900">{item.name}</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">{item.sold_quantity} phần</p>
                                                <p className="mt-0.5 text-xs text-slate-500">{formatCurrency(item.revenue)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                            <div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600" style={{ width: `${share}%` }} />
                                        </div>
                                        <p className="mt-1 text-right text-xs text-slate-400">{share.toFixed(1)}% tổng lượng bán</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <EmptyState message="Chưa có dữ liệu top món." />}
                </SectionCard>

                <SectionCard tag="Category Performance" title="Hiệu suất theo danh mục">
                    {loading ? <SkeletonBlock className="h-80" /> : categoryChartData.length > 0 ? (
                        <>
                            <div className="h-80 rounded-3xl bg-slate-50/70 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryChartData} layout="vertical" margin={{ left: 16, right: 12 }}>
                                        <defs>
                                            <linearGradient id="catGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#2dd4bf" />
                                                <stop offset="100%" stopColor="#0f766e" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#334155", fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<ChartTooltip formatter={(v, name) => name === "Doanh thu" ? formatCurrency(v) : `${v} phần`} />} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="soldQuantity" name="Số lượng bán" fill="url(#catGrad)" radius={[0, 10, 10, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            <th className="py-3 pl-4">Danh mục</th>
                                            <th className="py-3 text-right">SL bán</th>
                                            <th className="py-3 pr-4 text-right">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryChartData.map((item) => (
                                            <tr key={item.name} className="border-b border-slate-100 last:border-0">
                                                <td className="py-3 pl-4 font-medium text-slate-900">{item.name}</td>
                                                <td className="py-3 text-right text-slate-700">{item.soldQuantity}</td>
                                                <td className="py-3 pr-4 text-right text-slate-700">{formatCurrency(item.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : <EmptyState message="Chưa có dữ liệu danh mục theo kỳ." />}
                </SectionCard>
            </div>

            {!loading && topItemsChartData.length > 0 ? (
                <SectionCard tag="Revenue by Item" title="Doanh thu theo món">
                    <div className="h-72 rounded-3xl bg-slate-50/70 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topItemsChartData} layout="vertical" margin={{ left: 16, right: 12 }}>
                                <defs>
                                    <linearGradient id="itemRevGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#60a5fa" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" horizontal={false} />
                                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                                <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#334155", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
                                <Bar dataKey="revenue" name="Doanh thu" fill="url(#itemRevGrad)" radius={[0, 10, 10, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>
            ) : null}
        </div>
    );
};

/* ─── Tab: Khách hàng ─── */
const getRankLabel = (rank) => {
    switch (rank) {
        case "loyal": return "Thân thiết";
        case "normal": return "Thường";
        default: return rank || "Thường";
    }
};

const getRankClasses = (rank) => {
    switch (rank) {
        case "loyal": return "bg-amber-50 text-amber-700 border border-amber-200";
        default: return "bg-slate-50 text-slate-600 border border-slate-200";
    }
};

const CustomersTab = ({ loading, customerMetrics, customerRanking, customerRankDistribution }) => (
    <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Khách đặt hàng" value={customerMetrics.orderingCustomers} hint="Trong kỳ thống kê" tone="border-sky-200 bg-sky-50/70" icon="fa-solid fa-user" />
            <SummaryCard label="Khách hàng mới" value={customerMetrics.newCustomers} hint="Đăng ký trong kỳ" tone="border-emerald-200 bg-emerald-50/70" icon="fa-solid fa-user-plus" />
            <SummaryCard label="Khách quay lại" value={customerMetrics.returningCustomers} hint={`Tỷ lệ quay lại ${customerMetrics.repeatRate}%`} tone="border-violet-200 bg-violet-50/70" icon="fa-solid fa-rotate" />
            <SummaryCard label="Tỷ lệ quay lại" value={`${customerMetrics.repeatRate}%`} hint="Khách đặt >= 2 đơn" tone="border-amber-200 bg-amber-50/70" icon="fa-solid fa-chart-line" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <SectionCard tag="Customer Ranking" title="Xếp hạng khách hàng theo chi tiêu">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-16 mb-3" />)
                ) : customerRanking.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    <th className="py-3 pl-4">#</th>
                                    <th className="py-3">Khách hàng</th>
                                    <th className="py-3">Hạng</th>
                                    <th className="py-3 text-right">Số đơn</th>
                                    <th className="py-3 pr-4 text-right">Chi tiêu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerRanking.map((item, index) => (
                                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-3 pl-4">
                                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${index < 3 ? "bg-amber-500" : "bg-slate-400"}`}>{index + 1}</span>
                                        </td>
                                        <td className="py-3">
                                            <p className="font-medium text-slate-900">{item.fullName}</p>
                                            <p className="text-xs text-slate-500">{item.phone}</p>
                                        </td>
                                        <td className="py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRankClasses(item.rank)}`}>
                                                {getRankLabel(item.rank)}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-semibold text-slate-900">{item.orderCount}</td>
                                        <td className="py-3 pr-4 text-right font-semibold text-emerald-700">{formatCurrency(item.totalSpent)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <EmptyState message="Chưa có dữ liệu xếp hạng khách hàng trong kỳ." />}
            </SectionCard>

            <SectionCard tag="Rank Distribution" title="Phân bổ hạng khách hàng">
                {loading ? <SkeletonBlock className="h-64" /> : customerRankDistribution.length > 0 ? (
                    <>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="rankLoyalGrad" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#fbbf24" />
                                            <stop offset="100%" stopColor="#f59e0b" />
                                        </linearGradient>
                                        <linearGradient id="rankNormalGrad" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#94a3b8" />
                                            <stop offset="100%" stopColor="#64748b" />
                                        </linearGradient>
                                    </defs>
                                    <Pie data={customerRankDistribution.map((item) => ({ name: getRankLabel(item.rank), value: item.count, rank: item.rank }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                                        {customerRankDistribution.map((entry) => (
                                            <Cell key={entry.rank} fill={entry.rank === "loyal" ? "url(#rankLoyalGrad)" : "url(#rankNormalGrad)"} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip formatter={(v) => `${v} khách`} />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-2">
                            {customerRankDistribution.map((item) => {
                                const total = customerRankDistribution.reduce((s, i) => s + i.count, 0);
                                const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
                                return (
                                    <div key={item.rank} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRankClasses(item.rank)}`}>{getRankLabel(item.rank)}</span>
                                        <span className="text-sm font-semibold text-slate-900">{item.count} <span className="font-normal text-slate-500">({pct}%)</span></span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : <EmptyState message="Chưa có dữ liệu phân bổ hạng." />}
            </SectionCard>
        </div>
    </div>
);

/* ─── Tab: Đánh giá ─── */
const ReviewsTab = ({ loading, reviewMetrics, ratingChartData }) => (
    <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Tổng lượt đánh giá" value={reviewMetrics.reviewCount} tone="border-sky-200 bg-sky-50/70" icon="fa-solid fa-comments" />
            <SummaryCard label="Điểm đánh giá TB" value={Number(reviewMetrics.averageRating || 0).toFixed(1)} hint="Thang 5 sao" tone="border-amber-200 bg-amber-50/70" icon="fa-solid fa-star" />
            <SummaryCard label="Đánh giá tích cực" value={reviewMetrics.positiveReviews} hint={`${reviewMetrics.positiveRate}% review >= 4 sao`} tone="border-emerald-200 bg-emerald-50/70" icon="fa-solid fa-thumbs-up" />
            <SummaryCard label="Tỷ lệ tích cực" value={`${reviewMetrics.positiveRate}%`} hint=">= 4 sao / tổng review" tone="border-violet-200 bg-violet-50/70" icon="fa-solid fa-face-smile" />
        </div>

        <SectionCard tag="Rating Distribution" title="Phân bổ số sao đánh giá">
            {loading ? <SkeletonBlock className="h-72" /> : ratingChartData.length > 0 ? (
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="h-72 rounded-3xl bg-slate-50/70 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ratingChartData}>
                                <defs>
                                    <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#fbbf24" />
                                        <stop offset="100%" stopColor="#f59e0b" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                                <XAxis dataKey="rating" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip formatter={(v) => `${v} lượt`} />} />
                                <Bar dataKey="count" name="Số lượt" fill="url(#ratingGrad)" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                        {ratingChartData.map((item) => {
                            const total = ratingChartData.reduce((s, i) => s + i.count, 0);
                            const pct = total > 0 ? (item.count / total * 100).toFixed(1) : "0.0";
                            return (
                                <div key={item.rating} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-900">{item.rating}</p>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-900">{item.count} lượt</p>
                                            <p className="text-xs text-slate-500">{pct}%</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                        <div className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-500" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : <EmptyState message="Chưa có dữ liệu đánh giá trong kỳ." />}
        </SectionCard>
    </div>
);

/* ─── Tab: Voucher & Khuyến mãi ─── */
const VouchersTab = ({ loading, voucherMetrics, promotionMetrics, topPromotions, summary }) => (
    <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Đơn dùng voucher" value={voucherMetrics.ordersWithVoucher} hint={`Tỷ lệ ${voucherMetrics.usageRate}%`} tone="border-rose-200 bg-rose-50/70" icon="fa-solid fa-ticket" />
            <SummaryCard label="Tổng giảm giá voucher" value={formatCurrency(voucherMetrics.totalDiscount)} hint="Tổng chiết khấu voucher" tone="border-amber-200 bg-amber-50/70" icon="fa-solid fa-tag" />
            <SummaryCard label="Đơn có khuyến mãi" value={promotionMetrics.ordersWithPromotion} hint={`Tỷ lệ ${promotionMetrics.promotionUsageRate}%`} tone="border-indigo-200 bg-indigo-50/70" icon="fa-solid fa-percent" />
            <SummaryCard label="Tổng giảm giá KM" value={formatCurrency(promotionMetrics.totalPromotionDiscount)} hint="Tổng chiết khấu khuyến mãi" tone="border-emerald-200 bg-emerald-50/70" icon="fa-solid fa-fire" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard tag="Voucher Analysis" title="Phân tích hiệu quả Voucher">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tỷ lệ sử dụng voucher</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{voucherMetrics.usageRate}%</p>
                        <p className="mt-2 text-sm text-slate-500">{voucherMetrics.ordersWithVoucher} / {summary.totalOrders} đơn</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Mã voucher sử dụng</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{voucherMetrics.uniqueVouchers}</p>
                        <p className="mt-2 text-sm text-slate-500">Mã khác nhau</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Giảm giá TB / đơn (voucher)</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {formatCurrency(voucherMetrics.ordersWithVoucher > 0 ? voucherMetrics.totalDiscount / voucherMetrics.ordersWithVoucher : 0)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">DT đơn có voucher</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(voucherMetrics.revenueWithVoucher)}</p>
                        <p className="mt-2 text-sm text-slate-500">Đơn hoàn thành có voucher</p>
                    </div>
                </div>
            </SectionCard>

            <SectionCard tag="Promotion Analysis" title="Phân tích hiệu quả Khuyến mãi">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tỷ lệ áp dụng KM</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{promotionMetrics.promotionUsageRate}%</p>
                        <p className="mt-2 text-sm text-slate-500">{promotionMetrics.ordersWithPromotion} / {summary.totalOrders} đơn</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Lượt áp dụng KM</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{promotionMetrics.promotionUsageCount}</p>
                        <p className="mt-2 text-sm text-slate-500">Tổng lượt giảm giá KM trên món</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">DT đơn có KM</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(promotionMetrics.revenueWithPromotion)}</p>
                        <p className="mt-2 text-sm text-slate-500">Đơn hoàn thành có khuyến mãi</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tỷ lệ chiết khấu KM</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {promotionMetrics.revenueWithPromotion > 0
                                ? ((promotionMetrics.totalPromotionDiscount / (promotionMetrics.revenueWithPromotion + promotionMetrics.totalPromotionDiscount)) * 100).toFixed(1)
                                : "0.0"}%
                        </p>
                    </div>
                </div>
            </SectionCard>
        </div>

        {!loading && topPromotions.length > 0 ? (
            <SectionCard tag="Top Promotions" title="Khuyến mãi hiệu quả nhất">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th className="py-3 pl-4">STT</th>
                                <th className="py-3">Tên khuyến mãi</th>
                                <th className="py-3 text-right">Giảm giá</th>
                                <th className="py-3 text-right">Số đơn</th>
                                <th className="py-3 pr-4 text-right">Tổng chiết khấu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topPromotions.map((item, index) => (
                                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                    <td className="py-3 pl-4">
                                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${index < 3 ? "bg-indigo-500" : "bg-slate-400"}`}>{index + 1}</span>
                                    </td>
                                    <td className="py-3 font-medium text-slate-900">{item.name || `KM #${item.id}`}</td>
                                    <td className="py-3 text-right text-slate-700">
                                        {item.discountPercent > 0 ? `${item.discountPercent}%` : formatCurrency(item.flatDiscount)}
                                    </td>
                                    <td className="py-3 text-right font-semibold text-slate-900">{item.orderCount}</td>
                                    <td className="py-3 pr-4 text-right font-semibold text-rose-600">{formatCurrency(item.totalDiscountGiven)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SectionCard>
        ) : null}
    </div>
);

/* ─── Tab: Khu vực ─── */
const AreasTab = ({ loading, wardDemand }) => {
    const totalWardOrders = useMemo(() => wardDemand.reduce((s, i) => s + i.orderCount, 0), [wardDemand]);
    const totalWardRevenue = useMemo(() => wardDemand.reduce((s, i) => s + i.revenue, 0), [wardDemand]);
    const top5 = useMemo(() => wardDemand.slice(0, 5), [wardDemand]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Tổng khu vực" value={wardDemand.length} hint="Có đơn hàng trong kỳ" tone="border-teal-200 bg-teal-50/70" icon="fa-solid fa-map-location-dot" />
                <SummaryCard label="Tổng đơn theo khu vực" value={totalWardOrders} tone="border-sky-200 bg-sky-50/70" icon="fa-solid fa-box" />
                <SummaryCard label="Tổng doanh thu" value={formatCurrency(totalWardRevenue)} tone="border-emerald-200 bg-emerald-50/70" icon="fa-solid fa-money-bill-wave" />
                <SummaryCard label="Khu vực dẫn đầu" value={wardDemand[0]?.wardName || "-"} hint={wardDemand[0] ? `${wardDemand[0].orderCount} đơn` : ""} tone="border-amber-200 bg-amber-50/70" icon="fa-solid fa-trophy" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard tag="Top Areas" title="Top 5 khu vực nổi bật">
                    {loading ? <SkeletonBlock className="h-72" /> : top5.length > 0 ? (
                        <div className="h-72 rounded-3xl bg-slate-50/70 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top5.map((item) => ({ name: item.wardName, orders: item.orderCount, revenue: item.revenue }))} layout="vertical" margin={{ left: 8, right: 12 }}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#2dd4bf" />
                                            <stop offset="100%" stopColor="#0f766e" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: "#334155", fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip formatter={(v, name) => name === "Doanh thu" ? formatCurrency(v) : `${v} đơn`} />} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="orders" name="Số đơn" fill="url(#areaGrad)" radius={[0, 10, 10, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <EmptyState message="Chưa có dữ liệu khu vực." />}
                </SectionCard>

                <SectionCard tag="Revenue by Area" title="Doanh thu theo khu vực (Top 5)">
                    {loading ? <SkeletonBlock className="h-72" /> : top5.length > 0 ? (
                        <div className="h-72 rounded-3xl bg-slate-50/70 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top5.map((item) => ({ name: item.wardName, revenue: item.revenue }))} layout="vertical" margin={{ left: 8, right: 12 }}>
                                    <defs>
                                        <linearGradient id="areaRevGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#60a5fa" />
                                            <stop offset="100%" stopColor="#2563eb" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: "#334155", fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
                                    <Bar dataKey="revenue" name="Doanh thu" fill="url(#areaRevGrad)" radius={[0, 10, 10, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <EmptyState message="Chưa có dữ liệu doanh thu khu vực." />}
                </SectionCard>
            </div>

            <SectionCard tag="All Areas" title="Chi tiết tất cả khu vực">
                {loading ? <SkeletonBlock /> : wardDemand.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    <th className="py-3 pl-4">#</th>
                                    <th className="py-3">Khu vực</th>
                                    <th className="py-3 text-right">Số đơn</th>
                                    <th className="py-3 text-right">Doanh thu</th>
                                    <th className="py-3 pr-4 text-right">Tỷ trọng đơn</th>
                                    <th className="py-3 pr-4 w-40"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {wardDemand.map((item, index) => {
                                    const pct = totalWardOrders > 0 ? ((item.orderCount / totalWardOrders) * 100).toFixed(1) : "0.0";
                                    return (
                                        <tr key={item.wardName} className="border-b border-slate-100 last:border-0">
                                            <td className="py-3 pl-4">
                                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${index < 3 ? "bg-teal-600" : "bg-slate-400"}`}>{index + 1}</span>
                                            </td>
                                            <td className="py-3 font-medium text-slate-900">{item.wardName}</td>
                                            <td className="py-3 text-right font-semibold text-slate-900">{item.orderCount}</td>
                                            <td className="py-3 text-right text-slate-700">{formatCurrency(item.revenue)}</td>
                                            <td className="py-3 pr-4 text-right text-slate-600">{pct}%</td>
                                            <td className="py-3 pr-4">
                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div className="h-full rounded-full bg-linear-to-r from-teal-400 to-teal-600" style={{ width: `${pct}%` }} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : <EmptyState message="Chưa có dữ liệu khu vực giao hàng." />}
            </SectionCard>
        </div>
    );
};

/* ─── Tab: Nhân sự ─── */
const StaffTab = ({ loading, staffMetrics }) => {
    const { summary: staffSummary, shippers } = staffMetrics;
    const totalAssigned = useMemo(() => shippers.reduce((s, i) => s + i.assignedOrders, 0), [shippers]);
    const totalDelivered = useMemo(() => shippers.reduce((s, i) => s + i.completedOrders, 0), [shippers]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Tổng Admin" value={staffSummary.totalAdmins} tone="border-indigo-200 bg-indigo-50/70" icon="fa-solid fa-user-shield" />
                <SummaryCard label="Tổng Shipper" value={staffSummary.totalShippers} hint={`${staffSummary.activeShippers} hoạt động, ${staffSummary.inactiveShippers} ngưng`} tone="border-sky-200 bg-sky-50/70" icon="fa-solid fa-motorcycle" />
                <SummaryCard label="Đơn đã giao (kỳ)" value={totalDelivered} hint={`/ ${totalAssigned} đơn phân công`} tone="border-emerald-200 bg-emerald-50/70" icon="fa-solid fa-box-open" />
                <SummaryCard label="Shipper hoạt động" value={staffSummary.activeShippers} hint={`${staffSummary.totalShippers > 0 ? ((staffSummary.activeShippers / staffSummary.totalShippers) * 100).toFixed(0) : 0}% tổng shipper`} tone="border-teal-200 bg-teal-50/70" icon="fa-solid fa-circle-check" />
            </div>

            <SectionCard tag="Shipper Performance" title="Hiệu suất Shipper trong kỳ">
                {loading ? <SkeletonBlock /> : shippers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    <th className="py-3 pl-4">#</th>
                                    <th className="py-3">Shipper</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="py-3 text-right">Phân công</th>
                                    <th className="py-3 text-right">Hoàn thành</th>
                                    <th className="py-3 text-right">Hủy</th>
                                    <th className="py-3 text-right">Tỷ lệ HT</th>
                                    <th className="py-3 pr-4 text-right">DT giao</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shippers.map((item, index) => (
                                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-3 pl-4">
                                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${index < 3 ? "bg-indigo-500" : "bg-slate-400"}`}>{index + 1}</span>
                                        </td>
                                        <td className="py-3">
                                            <p className="font-medium text-slate-900">{item.fullName}</p>
                                            <p className="text-xs text-slate-500">{item.phone}</p>
                                        </td>
                                        <td className="py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
                                                {item.isActive ? "Hoạt động" : "Ngưng"}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right text-slate-700">{item.assignedOrders}</td>
                                        <td className="py-3 text-right font-semibold text-emerald-700">{item.completedOrders}</td>
                                        <td className="py-3 text-right text-rose-600">{item.cancelledOrders}</td>
                                        <td className="py-3 text-right font-semibold text-slate-900">{item.completionRate}%</td>
                                        <td className="py-3 pr-4 text-right text-slate-700">{formatCurrency(item.deliveredRevenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <EmptyState message="Chưa có dữ liệu shipper." />}
            </SectionCard>

            {!loading && shippers.filter((s) => s.assignedOrders > 0).length > 0 ? (
                <SectionCard tag="Delivery Chart" title="So sánh đơn giao theo Shipper">
                    <div className="h-80 rounded-3xl bg-slate-50/70 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shippers.filter((s) => s.assignedOrders > 0).map((s) => ({ name: s.fullName, assigned: s.assignedOrders, completed: s.completedOrders, cancelled: s.cancelledOrders }))}>
                                <defs>
                                    <linearGradient id="shipAssignGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#93c5fd" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                    <linearGradient id="shipCompleteGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6ee7b7" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <linearGradient id="shipCancelGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#fca5a5" />
                                        <stop offset="100%" stopColor="#dc2626" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip formatter={(v) => `${v} đơn`} />} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="assigned" name="Phân công" fill="url(#shipAssignGrad)" radius={[10, 10, 0, 0]} />
                                <Bar dataKey="completed" name="Hoàn thành" fill="url(#shipCompleteGrad)" radius={[10, 10, 0, 0]} />
                                <Bar dataKey="cancelled" name="Hủy" fill="url(#shipCancelGrad)" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>
            ) : null}
        </div>
    );
};

/* ─── Main Page Component ─── */
const StatisticsPage = () => {
    const [activeTab, setActiveTab] = useState("overview");
    const [draftFilters, setDraftFilters] = useState(() => createPresetFilters("today"));
    const [filters, setFilters] = useState(() => createPresetFilters("today"));
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    useEffect(() => {
        const fetchStatistics = async () => {
            setLoading(true);
            setErrorMessage("");
            try {
                const response = await dashboardApi.getStatistics({
                    fromDate: filters.fromDate,
                    toDate: filters.toDate,
                    status: filters.status,
                    groupBy: filters.groupBy,
                    topLimit: filters.topLimit
                });
                setStatistics(response.data?.data || null);
            } catch (error) {
                console.error("Error fetching statistics:", error);
                setErrorMessage("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchStatistics();
    }, [filters]);

    const summary = statistics?.summary || { totalOrders: 0, completedOrders: 0, cancelledOrders: 0, activeOrders: 0, totalRevenue: 0, averageOrderValue: 0, completionRate: 0, cancellationRate: 0 };
    const trend = statistics?.trend || [];
    const statusBreakdown = statistics?.statusBreakdown || [];
    const paymentBreakdown = statistics?.paymentBreakdown || [];
    const topItems = statistics?.topItems || [];
    const customerMetrics = statistics?.customerMetrics || { orderingCustomers: 0, newCustomers: 0, returningCustomers: 0, repeatRate: 0 };
    const reviewMetrics = statistics?.reviewMetrics || { reviewCount: 0, averageRating: 0, positiveReviews: 0, positiveRate: 0, ratingBreakdown: [] };
    const menuMetrics = statistics?.menuMetrics || { totalItems: 0, activeItems: 0, inactiveItems: 0, soldQuantity: 0, categoryPerformance: [] };
    const fulfillmentMetrics = statistics?.fulfillmentMetrics || { avgFulfillmentMinutes: 0, medianFulfillmentMinutes: 0 };
    const voucherMetrics = statistics?.voucherMetrics || { ordersWithVoucher: 0, uniqueVouchers: 0, totalDiscount: 0, revenueWithVoucher: 0, usageRate: 0 };
    const paymentStatusBreakdown = statistics?.paymentStatusBreakdown || [];
    const wardDemand = statistics?.wardDemand || [];
    const alerts = statistics?.alerts || [];
    const customerRanking = statistics?.customerRanking || [];
    const customerRankDistribution = statistics?.customerRankDistribution || [];
    const promotionMetrics = statistics?.promotionMetrics || { promotionUsageCount: 0, ordersWithPromotion: 0, totalPromotionDiscount: 0, revenueWithPromotion: 0, promotionUsageRate: 0 };
    const topPromotions = statistics?.topPromotions || [];
    const staffMetrics = statistics?.staffMetrics || { summary: { totalAdmins: 0, totalShippers: 0, activeShippers: 0, inactiveShippers: 0 }, shippers: [] };

    const statusMixData = useMemo(() => statusBreakdown.map((item) => ({ ...item, count: Number(item.count || 0) })).filter((item) => item.count > 0), [statusBreakdown]);
    const statusTotal = useMemo(() => statusMixData.reduce((sum, item) => sum + item.count, 0), [statusMixData]);
    const statusMixDisplay = useMemo(() => statusMixData.map((item) => ({ ...item, percent: statusTotal > 0 ? (item.count / statusTotal) * 100 : 0 })), [statusMixData, statusTotal]);
    const topItemTotal = useMemo(() => topItems.reduce((sum, item) => sum + Number(item.sold_quantity || 0), 0), [topItems]);
    const trendRevenue = useMemo(() => trend.reduce((sum, item) => sum + Number(item.revenue || 0), 0), [trend]);

    const trendChartData = useMemo(() => trend.map((item) => ({
        label: formatPeriodLabel(item.periodStart, filters.groupBy),
        revenue: Number(item.revenue || 0),
        orderCount: Number(item.orderCount || 0),
        completedOrders: Number(item.completedOrders || 0)
    })), [filters.groupBy, trend]);

    const paymentChartData = useMemo(() => paymentBreakdown.map((item) => ({
        name: getPaymentMethodText(item.method),
        orderCount: Number(item.orderCount || 0),
        revenue: Number(item.revenue || 0)
    })), [paymentBreakdown]);

    const topItemsChartData = useMemo(() => topItems.map((item) => ({
        name: item.name,
        soldQuantity: Number(item.sold_quantity || 0),
        revenue: Number(item.revenue || 0)
    })), [topItems]);

    const ratingChartData = useMemo(() => reviewMetrics.ratingBreakdown.map((item) => ({
        rating: `${item.rating} sao`,
        count: Number(item.count || 0)
    })), [reviewMetrics.ratingBreakdown]);

    const categoryChartData = useMemo(() => menuMetrics.categoryPerformance.map((item) => ({
        name: item.name,
        soldQuantity: Number(item.soldQuantity || 0),
        revenue: Number(item.revenue || 0)
    })), [menuMetrics.categoryPerformance]);

    const paymentStatusChartData = useMemo(() => paymentStatusBreakdown.map((item) => ({
        name: getPaymentStatusText(item.paymentStatus),
        count: Number(item.count || 0)
    })), [paymentStatusBreakdown]);

    const handlePresetChange = (preset) => {
        if (preset === "custom") {
            setDraftFilters((prev) => ({ ...prev, preset: "custom" }));
            setShowAdvancedFilters(true);
            return;
        }
        const next = createPresetFilters(preset);
        setDraftFilters(next);
        setFilters(next);
        setShowAdvancedFilters(false);
    };

    const handleApplyFilters = () => {
        setFilters({ ...draftFilters, preset: "custom" });
    };

    const handleDateFilterChange = (field, value) => {
        setDraftFilters((prev) => {
            const next = { ...prev, [field]: value, preset: "custom" };
            setFilters(next);
            return next;
        });
    };

    const handleExportPdf = () => {
        if (!statistics || loading) return;
        setIsExporting(true);
        try {
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const reportTitle = getReportTitleByFilters(filters);
            const statusFilterLabel = STATUS_OPTIONS.find((i) => i.value === filters.status)?.label || filters.status;
            const groupByLabel = GROUP_BY_OPTIONS.find((i) => i.value === filters.groupBy)?.label || filters.groupBy;
            const generatedAt = new Date().toLocaleString("vi-VN");
            const fileName = `bao-cao-thong-ke-${filters.fromDate || "from"}-${filters.toDate || "to"}.pdf`;

            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 34, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(248, 250, 252);
            doc.text("CADAO MANAGER - BAO CAO THONG KE", 14, 14);
            doc.setFontSize(11);
            doc.text(reportTitle.toUpperCase(), 14, 22);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Xuat luc: ${generatedAt}`, 14, 29);

            autoTable(doc, { startY: 40, theme: "grid", head: [["Thong tin loc", "Gia tri"]], body: [["Tu ngay", formatDateForReport(filters.fromDate)], ["Den ngay", formatDateForReport(filters.toDate)], ["Trang thai don", statusFilterLabel], ["Nhom du lieu", groupByLabel], ["Top mon", `${filters.topLimit}`]], headStyles: { fillColor: [30, 41, 59], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });

            autoTable(doc, { startY: doc.lastAutoTable.finalY + 6, theme: "grid", head: [["Tong quan", "Gia tri"]], body: [["Doanh thu trong ky", formatCurrency(summary.totalRevenue)], ["Tong don phat sinh", `${summary.totalOrders}`], ["Don hoan thanh", `${summary.completedOrders}`], ["Don dang xu ly", `${summary.activeOrders}`], ["Ti le hoan thanh", `${summary.completionRate}%`], ["Ti le huy", `${summary.cancellationRate}%`], ["Gia tri don TB", formatCurrency(summary.averageOrderValue)]], headStyles: { fillColor: [5, 150, 105], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });

            autoTable(doc, { startY: doc.lastAutoTable.finalY + 6, theme: "grid", head: [["Khach hang & Danh gia", "Gia tri"]], body: [["Khach dat hang", `${customerMetrics.orderingCustomers}`], ["Khach moi", `${customerMetrics.newCustomers}`], ["Khach quay lai", `${customerMetrics.returningCustomers}`], ["Ti le quay lai", `${customerMetrics.repeatRate}%`], ["So luot danh gia", `${reviewMetrics.reviewCount}`], ["Diem danh gia TB", `${Number(reviewMetrics.averageRating || 0).toFixed(1)}`], ["Danh gia tich cuc", `${reviewMetrics.positiveReviews} (${reviewMetrics.positiveRate}%)`]], headStyles: { fillColor: [8, 145, 178], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });

            autoTable(doc, { startY: doc.lastAutoTable.finalY + 6, theme: "grid", head: [["Van hanh", "Gia tri"]], body: [["TG hoan tat TB", `${Math.round(fulfillmentMetrics.avgFulfillmentMinutes)} phut`], ["TG hoan tat trung vi", `${Math.round(fulfillmentMetrics.medianFulfillmentMinutes)} phut`], ["Mon dang kinh doanh", `${menuMetrics.activeItems}/${menuMetrics.totalItems}`], ["Mon tam ngung", `${menuMetrics.inactiveItems}`], ["San luong ban", `${menuMetrics.soldQuantity}`], ["Don dung voucher", `${voucherMetrics.ordersWithVoucher}`], ["Tong giam gia", formatCurrency(voucherMetrics.totalDiscount)], ["Ti le dung voucher", `${voucherMetrics.usageRate}%`]], headStyles: { fillColor: [79, 70, 229], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });

            autoTable(doc, { startY: doc.lastAutoTable.finalY + 6, theme: "striped", head: [["Trang thai don", "So don"]], body: statusBreakdown.length > 0 ? statusBreakdown.map((item) => [getStatusText(item.status), `${item.count}`]) : [["Khong co du lieu", "0"]], headStyles: { fillColor: [51, 65, 85], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });

            autoTable(doc, { startY: doc.lastAutoTable.finalY + 6, theme: "striped", head: [["Phuong thuc thanh toan", "So don", "Doanh thu"]], body: paymentBreakdown.length > 0 ? paymentBreakdown.map((item) => [getPaymentMethodText(item.method), `${item.orderCount}`, formatCurrency(item.revenue)]) : [["Khong co du lieu", "0", "0d"]], headStyles: { fillColor: [14, 116, 144], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });

            autoTable(doc, { startY: doc.lastAutoTable.finalY + 6, theme: "striped", head: [["Top mon", "So luong", "Doanh thu"]], body: topItems.length > 0 ? topItems.map((item) => [item.name, `${item.sold_quantity}`, formatCurrency(item.revenue)]) : [["Khong co du lieu", "0", "0d"]], headStyles: { fillColor: [5, 150, 105], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });

            autoTable(doc, { startY: doc.lastAutoTable.finalY + 6, theme: "grid", head: [["Top khu vuc", "So don", "Doanh thu"]], body: wardDemand.length > 0 ? wardDemand.map((item) => [item.wardName, `${item.orderCount}`, formatCurrency(item.revenue)]) : [["Khong co du lieu", "0", "0d"]], headStyles: { fillColor: [15, 118, 110], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });

            if (alerts.length > 0) {
                autoTable(doc, { startY: doc.lastAutoTable.finalY + 6, theme: "plain", head: [["Canh bao van hanh"]], body: alerts.map((item, index) => [`${index + 1}. ${item.message}`]), headStyles: { fillColor: [120, 53, 15], textColor: [255, 255, 255], fontSize: 10 }, styles: { fontSize: 10, cellPadding: 2.4 } });
            }

            const pageCount = doc.internal.getNumberOfPages();
            for (let page = 1; page <= pageCount; page += 1) {
                doc.setPage(page);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
                doc.text(`Trang ${page}/${pageCount}`, 195, 290, { align: "right" });
            }

            doc.save(fileName);
        } catch (error) {
            console.error("Error exporting statistics PDF:", error);
            setErrorMessage("Khong the xuat PDF. Vui long thu lai sau.");
        } finally {
            setIsExporting(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return <OverviewTab loading={loading} trendChartData={trendChartData} trendRevenue={trendRevenue} statusMixDisplay={statusMixDisplay} summary={summary} alerts={alerts} />;
            case "orders":
                return <OrdersTab loading={loading} summary={summary} statusMixDisplay={statusMixDisplay} paymentChartData={paymentChartData} paymentBreakdown={paymentBreakdown} paymentStatusChartData={paymentStatusChartData} fulfillmentMetrics={fulfillmentMetrics} />;
            case "menu":
                return <MenuTab loading={loading} menuMetrics={menuMetrics} topItems={topItems} topItemTotal={topItemTotal} categoryChartData={categoryChartData} topItemsChartData={topItemsChartData} />;
            case "customers":
                return <CustomersTab loading={loading} customerMetrics={customerMetrics} customerRanking={customerRanking} customerRankDistribution={customerRankDistribution} />;
            case "reviews":
                return <ReviewsTab loading={loading} reviewMetrics={reviewMetrics} ratingChartData={ratingChartData} />;
            case "vouchers":
                return <VouchersTab loading={loading} voucherMetrics={voucherMetrics} promotionMetrics={promotionMetrics} topPromotions={topPromotions} summary={summary} />;
            case "areas":
                return <AreasTab loading={loading} wardDemand={wardDemand} />;
            case "staff":
                return <StaffTab loading={loading} staffMetrics={staffMetrics} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="statistics" />

            <div className="flex-1">
                <AdminHeader
                    title="Thống kê"
                    subtitle="Phân tích doanh thu, đơn hàng, khách hàng và chất lượng vận hành."
                />

                <main className="space-y-6 p-6">
                    {/* ── Time Period & Filters ── */}
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-sm font-medium text-slate-500 mr-1">Mốc thời gian:</p>
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.key}
                                        onClick={() => handlePresetChange(preset.key)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${draftFilters.preset === preset.key ? "bg-slate-900 text-white shadow-md" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}

                                <div className="ml-auto flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <i className="fa-solid fa-sliders mr-2" />
                                        Bộ lọc nâng cao
                                    </button>
                                    <button
                                        onClick={handleExportPdf}
                                        disabled={loading || isExporting || !statistics}
                                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <i className="fa-solid fa-file-pdf mr-2" />
                                        {isExporting ? "Đang xuất..." : "Xuất PDF"}
                                    </button>
                                </div>
                            </div>

                            {(draftFilters.preset === "custom" || showAdvancedFilters) ? (
                                <div className="grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2 xl:grid-cols-5">
                                    <label className="space-y-2 text-sm text-slate-600">
                                        <span className="font-medium">Từ ngày</span>
                                        <input type="date" value={draftFilters.fromDate} onChange={(e) => handleDateFilterChange("fromDate", e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500" />
                                    </label>
                                    <label className="space-y-2 text-sm text-slate-600">
                                        <span className="font-medium">Đến ngày</span>
                                        <input type="date" value={draftFilters.toDate} onChange={(e) => handleDateFilterChange("toDate", e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500" />
                                    </label>
                                    <label className="space-y-2 text-sm text-slate-600">
                                        <span className="font-medium">Trạng thái đơn</span>
                                        <select value={draftFilters.status} onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500">
                                            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </label>
                                    <label className="space-y-2 text-sm text-slate-600">
                                        <span className="font-medium">Nhóm theo</span>
                                        <select value={draftFilters.groupBy} onChange={(e) => setDraftFilters((prev) => ({ ...prev, groupBy: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500">
                                            {GROUP_BY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </label>
                                    <label className="space-y-2 text-sm text-slate-600">
                                        <span className="font-medium">Top món</span>
                                        <input type="number" min="5" max="20" value={draftFilters.topLimit} onChange={(e) => setDraftFilters((prev) => ({ ...prev, topLimit: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500" />
                                    </label>
                                    <div className="flex items-end">
                                        <button onClick={handleApplyFilters} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>

                    {errorMessage ? (
                        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                            {errorMessage}
                        </section>
                    ) : null}

                    {/* ── Summary Strip ── */}
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <SummaryCard label="Doanh thu" value={formatCurrency(summary.totalRevenue)} hint={`TB ${formatCurrency(summary.averageOrderValue)}/đơn`} tone="border-emerald-200 bg-emerald-50/70" icon="fa-solid fa-wallet" />
                        <SummaryCard label="Số đơn" value={summary.totalOrders} hint={`${summary.completedOrders} hoàn thành`} tone="border-sky-200 bg-sky-50/70" icon="fa-solid fa-receipt" />
                        <SummaryCard label="Đánh giá" value={`${Number(reviewMetrics.averageRating || 0).toFixed(1)} ★`} hint={`${reviewMetrics.reviewCount} lượt đánh giá`} tone="border-amber-200 bg-amber-50/70" icon="fa-solid fa-star" />
                        <SummaryCard label="Món bán ra" value={menuMetrics.soldQuantity} hint={`${topItems[0]?.name || "—"} dẫn đầu`} tone="border-violet-200 bg-violet-50/70" icon="fa-solid fa-fire" />
                        <SummaryCard label="Khách hàng" value={customerMetrics.orderingCustomers} hint={`${customerMetrics.newCustomers} khách mới`} tone="border-cyan-200 bg-cyan-50/70" icon="fa-solid fa-users" />
                    </section>

                    {/* ── Tabs ── */}
                    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="flex overflow-x-auto border-b border-slate-200">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 whitespace-nowrap px-5 py-4 text-sm font-medium transition ${activeTab === tab.key ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    <i className={`${tab.icon} text-xs`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-6">
                            {renderTabContent()}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default StatisticsPage;