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

const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "preparing", label: "Đang chuẩn bị" },
    { value: "shipping", label: "Đang giao" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" }
];

const PRESETS = [
    { key: "today", label: "Hôm nay" },
    { key: "7days", label: "7 ngày" },
    { key: "30days", label: "30 ngày" },
    { key: "month", label: "Tháng này" },
    { key: "90days", label: "90 ngày" },
    { key: "custom", label: "Tùy chọn" }
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

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const createPresetFilters = (preset) => {
    const today = new Date();
    const end = toDateInputValue(today);
    const start = new Date(today);

    if (preset === "7days") {
        start.setDate(today.getDate() - 6);
    } else if (preset === "month") {
        start.setDate(1);
    } else if (preset === "90days") {
        start.setDate(today.getDate() - 89);
    } else {
        start.setDate(today.getDate() - 29);
    }

    return {
        preset,
        fromDate: toDateInputValue(start),
        toDate: end,
        status: "all",
        groupBy: preset === "90days" ? "week" : "day",
        topLimit: 3
    };
};

const formatPeriodLabel = (value, groupBy) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    if (groupBy === "week") {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `Tuần ${day}/${month}`;
    }

    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const getPaymentStatusText = (status) => {
    switch (status) {
        case "pending":
            return "Chờ thanh toán";
        case "paid":
            return "Đã thanh toán";
        case "failed":
            return "Thất bại";
        case "refunded":
            return "Đã hoàn tiền";
        default:
            return status;
    }
};

const formatDateForReport = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value || "-";
    }

    return date.toLocaleDateString("vi-VN");
};

const getReportTitleByFilters = ({ fromDate, toDate }) => {
    if (!fromDate || !toDate) {
        return "Bao cao thong ke";
    }

    if (fromDate === toDate) {
        return `Bao cao ngay ${formatDateForReport(fromDate)}`;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const monthLastDate = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
    const isFullMonth = from.getFullYear() === to.getFullYear()
        && from.getMonth() === to.getMonth()
        && from.getDate() === 1
        && to.getDate() === monthLastDate;

    if (isFullMonth) {
        return `Bao cao thang ${String(from.getMonth() + 1).padStart(2, "0")}/${from.getFullYear()}`;
    }

    return `Bao cao tu ${formatDateForReport(fromDate)} den ${formatDateForReport(toDate)}`;
};

const SummaryCard = ({ label, value, hint, tone }) => (
    <article className={`rounded-3xl border p-5 shadow-sm ${tone}`}>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
        <p className="mt-3 text-sm leading-6 text-slate-500">{hint}</p>
    </article>
);

const chartPalette = ["#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];
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

const ChartTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
            {label ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{labelFormatter ? labelFormatter(label) : label}</p> : null}
            <div className="mt-2 space-y-1.5">
                {payload.map((entry) => (
                    <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-4 text-sm">
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

const StatisticsPage = () => {
    const [draftFilters, setDraftFilters] = useState(() => createPresetFilters("today"));
    const [filters, setFilters] = useState(() => createPresetFilters("today"));
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isExporting, setIsExporting] = useState(false);

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

    const summary = statistics?.summary || {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        activeOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        completionRate: 0,
        cancellationRate: 0
    };
    const trend = statistics?.trend || [];
    const statusBreakdown = statistics?.statusBreakdown || [];
    const paymentBreakdown = statistics?.paymentBreakdown || [];
    const topItems = statistics?.topItems || [];
    const customerMetrics = statistics?.customerMetrics || {
        orderingCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        repeatRate: 0
    };
    const reviewMetrics = statistics?.reviewMetrics || {
        reviewCount: 0,
        averageRating: 0,
        positiveReviews: 0,
        positiveRate: 0,
        ratingBreakdown: []
    };
    const menuMetrics = statistics?.menuMetrics || {
        totalItems: 0,
        activeItems: 0,
        inactiveItems: 0,
        soldQuantity: 0,
        categoryPerformance: []
    };
    const fulfillmentMetrics = statistics?.fulfillmentMetrics || {
        avgFulfillmentMinutes: 0,
        medianFulfillmentMinutes: 0
    };
    const voucherMetrics = statistics?.voucherMetrics || {
        ordersWithVoucher: 0,
        uniqueVouchers: 0,
        totalDiscount: 0,
        revenueWithVoucher: 0,
        usageRate: 0
    };
    const paymentStatusBreakdown = statistics?.paymentStatusBreakdown || [];
    const wardDemand = statistics?.wardDemand || [];
    const alerts = statistics?.alerts || [];

    const statusTotal = useMemo(() => statusBreakdown.reduce((sum, item) => sum + Number(item.count || 0), 0), [statusBreakdown]);
    const topItemTotal = useMemo(() => topItems.reduce((sum, item) => sum + Number(item.sold_quantity || 0), 0), [topItems]);
    const trendRevenue = useMemo(() => trend.reduce((sum, item) => sum + Number(item.revenue || 0), 0), [trend]);

    const trendChartData = useMemo(() => (
        trend.map((item) => ({
            label: formatPeriodLabel(item.periodStart, filters.groupBy),
            revenue: Number(item.revenue || 0),
            orderCount: Number(item.orderCount || 0),
            completedOrders: Number(item.completedOrders || 0)
        }))
    ), [filters.groupBy, trend]);

    const paymentChartData = useMemo(() => (
        paymentBreakdown.map((item) => ({
            name: getPaymentMethodText(item.method),
            orderCount: Number(item.orderCount || 0),
            revenue: Number(item.revenue || 0)
        }))
    ), [paymentBreakdown]);

    const topItemsChartData = useMemo(() => (
        topItems.map((item) => ({
            name: item.name,
            soldQuantity: Number(item.sold_quantity || 0),
            revenue: Number(item.revenue || 0)
        }))
    ), [topItems]);

    const ratingChartData = useMemo(() => (
        reviewMetrics.ratingBreakdown.map((item) => ({
            rating: `${item.rating} sao`,
            count: Number(item.count || 0)
        }))
    ), [reviewMetrics.ratingBreakdown]);

    const categoryChartData = useMemo(() => (
        menuMetrics.categoryPerformance.map((item) => ({
            name: item.name,
            soldQuantity: Number(item.soldQuantity || 0),
            revenue: Number(item.revenue || 0)
        }))
    ), [menuMetrics.categoryPerformance]);

    const paymentStatusChartData = useMemo(() => (
        paymentStatusBreakdown.map((item) => ({
            name: getPaymentStatusText(item.paymentStatus),
            count: Number(item.count || 0)
        }))
    ), [paymentStatusBreakdown]);

    const menuActiveRate = menuMetrics.totalItems > 0
        ? ((menuMetrics.activeItems / menuMetrics.totalItems) * 100).toFixed(1)
        : "0.0";

    const handlePresetChange = (preset) => {
        const nextFilters = preset === "custom"
            ? { ...draftFilters, preset }
            : createPresetFilters(preset);

        setDraftFilters(nextFilters);
        if (preset !== "custom") {
            setFilters(nextFilters);
        }
    };

    const handleApplyFilters = () => {
        setFilters({ ...draftFilters, preset: "custom" });
    };

    const handleResetFilters = () => {
        const nextFilters = createPresetFilters("today");
        setDraftFilters(nextFilters);
        setFilters(nextFilters);
    };

    const handleExportPdf = () => {
        if (!statistics || loading) {
            return;
        }

        setIsExporting(true);

        try {
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const reportTitle = getReportTitleByFilters(filters);
            const statusFilterLabel = STATUS_OPTIONS.find((item) => item.value === filters.status)?.label || filters.status;
            const groupByLabel = GROUP_BY_OPTIONS.find((item) => item.value === filters.groupBy)?.label || filters.groupBy;
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

            autoTable(doc, {
                startY: 40,
                theme: "grid",
                head: [["Thong tin loc", "Gia tri"]],
                body: [
                    ["Tu ngay", formatDateForReport(filters.fromDate)],
                    ["Den ngay", formatDateForReport(filters.toDate)],
                    ["Trang thai don", statusFilterLabel],
                    ["Nhom du lieu", groupByLabel],
                    ["Top mon", `${filters.topLimit}`]
                ],
                headStyles: { fillColor: [30, 41, 59], fontSize: 10 },
                styles: { fontSize: 10, cellPadding: 2.4 }
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                theme: "grid",
                head: [["Tong quan", "Gia tri"]],
                body: [
                    ["Doanh thu trong ky", formatCurrency(summary.totalRevenue)],
                    ["Tong don phat sinh", `${summary.totalOrders}`],
                    ["Don hoan thanh", `${summary.completedOrders}`],
                    ["Don dang xu ly", `${summary.activeOrders}`],
                    ["Ti le hoan thanh", `${summary.completionRate}%`],
                    ["Ti le huy", `${summary.cancellationRate}%`],
                    ["Gia tri don TB", formatCurrency(summary.averageOrderValue)]
                ],
                headStyles: { fillColor: [5, 150, 105], fontSize: 10 },
                styles: { fontSize: 10, cellPadding: 2.4 }
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                theme: "grid",
                head: [["Khach hang & Danh gia", "Gia tri"]],
                body: [
                    ["Khach dat hang", `${customerMetrics.orderingCustomers}`],
                    ["Khach moi", `${customerMetrics.newCustomers}`],
                    ["Khach quay lai", `${customerMetrics.returningCustomers}`],
                    ["Ti le quay lai", `${customerMetrics.repeatRate}%`],
                    ["So luot danh gia", `${reviewMetrics.reviewCount}`],
                    ["Diem danh gia TB", `${Number(reviewMetrics.averageRating || 0).toFixed(1)}`],
                    ["Danh gia tich cuc", `${reviewMetrics.positiveReviews} (${reviewMetrics.positiveRate}%)`]
                ],
                headStyles: { fillColor: [8, 145, 178], fontSize: 10 },
                styles: { fontSize: 10, cellPadding: 2.4 }
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                theme: "grid",
                head: [["Van hanh", "Gia tri"]],
                body: [
                    ["TG hoan tat TB", `${Math.round(fulfillmentMetrics.avgFulfillmentMinutes)} phut`],
                    ["TG hoan tat trung vi", `${Math.round(fulfillmentMetrics.medianFulfillmentMinutes)} phut`],
                    ["Mon dang kinh doanh", `${menuMetrics.activeItems}/${menuMetrics.totalItems}`],
                    ["Mon tam ngung", `${menuMetrics.inactiveItems}`],
                    ["San luong ban", `${menuMetrics.soldQuantity}`],
                    ["Don dung voucher", `${voucherMetrics.ordersWithVoucher}`],
                    ["Tong giam gia", formatCurrency(voucherMetrics.totalDiscount)],
                    ["Ti le dung voucher", `${voucherMetrics.usageRate}%`]
                ],
                headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
                styles: { fontSize: 10, cellPadding: 2.4 }
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                theme: "striped",
                head: [["Trang thai don", "So don"]],
                body: statusBreakdown.length > 0
                    ? statusBreakdown.map((item) => [getStatusText(item.status), `${item.count}`])
                    : [["Khong co du lieu", "0"]],
                headStyles: { fillColor: [51, 65, 85], fontSize: 10 },
                styles: { fontSize: 10, cellPadding: 2.4 }
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                theme: "striped",
                head: [["Phuong thuc thanh toan", "So don", "Doanh thu"]],
                body: paymentBreakdown.length > 0
                    ? paymentBreakdown.map((item) => [
                        getPaymentMethodText(item.method),
                        `${item.orderCount}`,
                        formatCurrency(item.revenue)
                    ])
                    : [["Khong co du lieu", "0", "0d"]],
                headStyles: { fillColor: [14, 116, 144], fontSize: 10 },
                styles: { fontSize: 10, cellPadding: 2.4 }
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                theme: "striped",
                head: [["Top mon", "So luong", "Doanh thu"]],
                body: topItems.length > 0
                    ? topItems.map((item) => [item.name, `${item.sold_quantity}`, formatCurrency(item.revenue)])
                    : [["Khong co du lieu", "0", "0d"]],
                headStyles: { fillColor: [5, 150, 105], fontSize: 10 },
                styles: { fontSize: 10, cellPadding: 2.4 }
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                theme: "grid",
                head: [["Top khu vuc", "So don", "Doanh thu"]],
                body: wardDemand.length > 0
                    ? wardDemand.map((item) => [item.wardName, `${item.orderCount}`, formatCurrency(item.revenue)])
                    : [["Khong co du lieu", "0", "0d"]],
                headStyles: { fillColor: [15, 118, 110], fontSize: 10 },
                styles: { fontSize: 10, cellPadding: 2.4 }
            });

            if (alerts.length > 0) {
                autoTable(doc, {
                    startY: doc.lastAutoTable.finalY + 6,
                    theme: "plain",
                    head: [["Canh bao van hanh"]],
                    body: alerts.map((item, index) => [`${index + 1}. ${item.message}`]),
                    headStyles: { fillColor: [120, 53, 15], textColor: [255, 255, 255], fontSize: 10 },
                    styles: { fontSize: 10, cellPadding: 2.4 }
                });
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

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="statistics" />

            <div className="flex-1">
                <AdminHeader
                    title="Thống kê chuyên sâu"
                    subtitle="Theo dõi doanh thu, chất lượng vận hành và cơ cấu đơn hàng với bộ lọc phục vụ báo cáo thực tế."
                />

                <main className="space-y-6 p-6">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-wrap gap-3">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.key}
                                        onClick={() => handlePresetChange(preset.key)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${draftFilters.preset === preset.key ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="font-medium">Từ ngày</span>
                                    <input
                                        type="date"
                                        value={draftFilters.fromDate}
                                        onChange={(event) => setDraftFilters((prev) => ({ ...prev, fromDate: event.target.value, preset: "custom" }))}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="font-medium">Đến ngày</span>
                                    <input
                                        type="date"
                                        value={draftFilters.toDate}
                                        onChange={(event) => setDraftFilters((prev) => ({ ...prev, toDate: event.target.value, preset: "custom" }))}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="font-medium">Trạng thái đơn</span>
                                    <select
                                        value={draftFilters.status}
                                        onChange={(event) => setDraftFilters((prev) => ({ ...prev, status: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                    >
                                        {STATUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="font-medium">Nhóm theo</span>
                                    <select
                                        value={draftFilters.groupBy}
                                        onChange={(event) => setDraftFilters((prev) => ({ ...prev, groupBy: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                    >
                                        {GROUP_BY_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="font-medium">Top món</span>
                                    <input
                                        type="number"
                                        min="3"
                                        max="10"
                                        value={draftFilters.topLimit}
                                        onChange={(event) => setDraftFilters((prev) => ({ ...prev, topLimit: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                    />
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleApplyFilters}
                                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Áp dụng bộ lọc
                                </button>
                                <button
                                    onClick={handleResetFilters}
                                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Đặt lại mặc định
                                </button>
                                <button
                                    onClick={handleExportPdf}
                                    disabled={loading || isExporting || !statistics}
                                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isExporting ? "Đang xuất PDF..." : "Xuất PDF báo cáo"}
                                </button>
                            </div>
                        </div>
                    </section>

                    {errorMessage ? (
                        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                            {errorMessage}
                        </section>
                    ) : null}

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            label="Doanh thu trong kỳ"
                            value={formatCurrency(summary.totalRevenue)}
                            hint={`Giá trị trung bình ${formatCurrency(summary.averageOrderValue)}/đơn hoàn thành`}
                            tone="border-emerald-200 bg-emerald-50/70"
                        />
                        <SummaryCard
                            label="Tổng đơn phát sinh"
                            value={summary.totalOrders}
                            hint={`${summary.activeOrders} đơn vẫn đang nằm trong luồng xử lý`}
                            tone="border-sky-200 bg-sky-50/70"
                        />
                        <SummaryCard
                            label="Tỷ lệ hoàn thành"
                            value={`${summary.completionRate}%`}
                            hint={`${summary.completedOrders} đơn đã hoàn thành trong phạm vi lọc`}
                            tone="border-violet-200 bg-violet-50/70"
                        />
                        <SummaryCard
                            label="Tỷ lệ hủy"
                            value={`${summary.cancellationRate}%`}
                            hint={`${summary.cancelledOrders} đơn bị hủy, cần theo dõi nguyên nhân`}
                            tone="border-amber-200 bg-amber-50/70"
                        />
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Revenue & Volume</p>
                                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Xu hướng doanh thu và số đơn</h3>
                                </div>
                                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tổng doanh thu chart</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(trendRevenue)}</p>
                                </div>
                            </div>
                            <div className="mt-6 h-80">
                                {loading ? (
                                    <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
                                ) : trendChartData.length > 0 ? (
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
                                            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                                            <Tooltip content={<ChartTooltip formatter={(value, name) => name === "Doanh thu" ? formatCurrency(value) : `${value} đơn`} />} />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            <Bar yAxisId="left" dataKey="orderCount" name="Tổng đơn" fill="url(#statsOrdersGradient)" radius={[10, 10, 0, 0]} />
                                            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu" stroke="url(#statsRevenueGradient)" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#059669", strokeWidth: 0 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-80 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                                        Chưa có dữ liệu xu hướng trong khoảng thời gian đã chọn.
                                    </div>
                                )}
                            </div>
                        </article>

                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Status Mix</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Cơ cấu trạng thái đơn hàng</h3>
                            </div>
                            <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
                                {loading ? (
                                    Array.from({ length: 2 }).map((_, index) => (
                                        <div key={index} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
                                    ))
                                ) : statusBreakdown.length > 0 ? (
                                    <>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <defs>
                                                        {statusBreakdown.map((_, index) => (
                                                            <linearGradient key={`statusPieGradient-${index}`} id={`statusPieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                                                <stop offset="0%" stopColor={gradientPairs[index % gradientPairs.length][0]} />
                                                                <stop offset="100%" stopColor={gradientPairs[index % gradientPairs.length][1]} />
                                                            </linearGradient>
                                                        ))}
                                                    </defs>
                                                    <Pie data={statusBreakdown} dataKey="count" nameKey="status" innerRadius={58} outerRadius={92} paddingAngle={4}>
                                                        {statusBreakdown.map((entry, index) => (
                                                            <Cell key={`${entry.status}-${index}`} fill={`url(#statusPieGradient-${index})`} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<ChartTooltip formatter={(value) => `${value} đơn`} labelFormatter={(value) => getStatusText(value)} />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-4">
                                            {statusBreakdown.map((item) => {
                                                const percent = statusTotal > 0 ? (Number(item.count || 0) / statusTotal) * 100 : 0;
                                                return (
                                                    <div key={item.status} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[item.status] || "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                                                                {getStatusText(item.status)}
                                                            </span>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-slate-900">{item.count} đơn</p>
                                                                <p className="text-xs text-slate-500">{percent.toFixed(1)}%</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                                            <div className="h-full rounded-full bg-linear-to-r from-slate-700 to-slate-900" style={{ width: `${percent}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="xl:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                        Không có dữ liệu trạng thái phù hợp bộ lọc.
                                    </div>
                                )}
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Payment Mix</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Phương thức thanh toán</h3>
                            </div>
                            <div className="mt-6 grid gap-5 md:grid-cols-2">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                                    ))
                                ) : paymentBreakdown.length > 0 ? (
                                    <>
                                        <div className="md:col-span-2 h-72 rounded-3xl bg-slate-50/60 p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={paymentChartData}>
                                                    <defs>
                                                        <linearGradient id="statsPaymentGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#c084fc" />
                                                            <stop offset="100%" stopColor="#7c3aed" />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                                                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<ChartTooltip formatter={(value, name) => name === "Doanh thu" ? formatCurrency(value) : `${value} đơn`} />} />
                                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                                    <Bar dataKey="orderCount" name="Số đơn" fill="url(#statsPaymentGradient)" radius={[10, 10, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {paymentBreakdown.map((item) => (
                                            <div key={item.method} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{getPaymentMethodText(item.method)}</p>
                                                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.orderCount}</p>
                                                <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.revenue)}</p>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                        Chưa có dữ liệu thanh toán trong phạm vi lọc.
                                    </div>
                                )}
                            </div>
                        </article>

                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Top Items</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Món ăn tạo doanh thu</h3>
                            </div>
                            <div className="mt-6 space-y-4">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                                    ))
                                ) : topItems.length > 0 ? (
                                    <>
                                        <div className="h-72 rounded-3xl bg-slate-50/60 p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={topItemsChartData} layout="vertical" margin={{ left: 20, right: 12 }}>
                                                    <defs>
                                                        <linearGradient id="statsTopItemsGradient" x1="0" y1="0" x2="1" y2="0">
                                                            <stop offset="0%" stopColor="#22d3ee" />
                                                            <stop offset="100%" stopColor="#0ea5e9" />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" horizontal={false} />
                                                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                    <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#334155", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<ChartTooltip formatter={(value, name) => name === "Doanh thu" ? formatCurrency(value) : `${value} phần`} />} />
                                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                                    <Bar dataKey="soldQuantity" name="Số lượng bán" fill="url(#statsTopItemsGradient)" radius={[0, 10, 10, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {topItems.map((item, index) => {
                                            const share = topItemTotal > 0 ? (Number(item.sold_quantity || 0) / topItemTotal) * 100 : 0;
                                            return (
                                                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Hạng {index + 1}</p>
                                                            <h4 className="mt-1 text-sm font-semibold text-slate-900">{item.name}</h4>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-slate-900">{item.sold_quantity} phần</p>
                                                            <p className="mt-1 text-xs text-slate-500">{formatCurrency(item.revenue)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                                        <span>Tỷ trọng top list</span>
                                                        <span>{share.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                                        <div className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-400" style={{ width: `${share}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                        Chưa có dữ liệu top món theo phạm vi lọc.
                                    </div>
                                )}
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Customer & Review</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Khách hàng và chất lượng dịch vụ</h3>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard
                                    label="Khách đặt hàng"
                                    value={customerMetrics.orderingCustomers}
                                    hint={`${customerMetrics.newCustomers} khách mới trong kỳ`}
                                    tone="border-cyan-200 bg-cyan-50/70"
                                />
                                <SummaryCard
                                    label="Khách quay lại"
                                    value={customerMetrics.returningCustomers}
                                    hint={`Tỷ lệ quay lại ${customerMetrics.repeatRate}%`}
                                    tone="border-blue-200 bg-blue-50/70"
                                />
                                <SummaryCard
                                    label="Điểm đánh giá TB"
                                    value={Number(reviewMetrics.averageRating || 0).toFixed(1)}
                                    hint={`${reviewMetrics.reviewCount} lượt đánh giá`}
                                    tone="border-emerald-200 bg-emerald-50/70"
                                />
                                <SummaryCard
                                    label="Đánh giá tích cực"
                                    value={`${reviewMetrics.positiveRate}%`}
                                    hint={`${reviewMetrics.positiveReviews} review từ 4-5 sao`}
                                    tone="border-violet-200 bg-violet-50/70"
                                />
                            </div>

                            <div className="mt-6 rounded-3xl bg-slate-50/70 p-4">
                                {loading ? (
                                    <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
                                ) : ratingChartData.length > 0 ? (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={ratingChartData}>
                                                <defs>
                                                    <linearGradient id="statsRatingGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#38bdf8" />
                                                        <stop offset="100%" stopColor="#0284c7" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                                                <XAxis dataKey="rating" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<ChartTooltip formatter={(value) => `${value} lượt`} />} />
                                                <Bar dataKey="count" name="Số lượt" fill="url(#statsRatingGradient)" radius={[10, 10, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                                        Chưa có dữ liệu đánh giá trong kỳ.
                                    </div>
                                )}
                            </div>
                        </article>

                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Operation Alerts</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Cảnh báo vận hành cần theo dõi</h3>
                            </div>

                            <div className="mt-6 space-y-3">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                                    ))
                                ) : alerts.length > 0 ? (
                                    alerts.map((item) => (
                                        <div key={item.code} className={`rounded-2xl border px-4 py-4 ${alertToneClasses[item.level] || "border-slate-200 bg-slate-50 text-slate-700"}`}>
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em]">{item.level}</p>
                                            <p className="mt-2 text-sm leading-6">{item.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                        Không có cảnh báo nào trong phạm vi lọc.
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">TG hoàn tất TB</p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{Math.round(fulfillmentMetrics.avgFulfillmentMinutes)} phút</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">TG hoàn tất trung vị</p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{Math.round(fulfillmentMetrics.medianFulfillmentMinutes)} phút</p>
                                </div>
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-2">
                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Menu Performance</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Hiệu suất menu và danh mục</h3>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Món đang kinh doanh</p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{menuMetrics.activeItems}/{menuMetrics.totalItems}</p>
                                    <p className="mt-1 text-xs text-slate-500">Tỷ lệ active {menuActiveRate}%</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Món tạm ngưng</p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{menuMetrics.inactiveItems}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sản lượng bán</p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{menuMetrics.soldQuantity}</p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-3xl bg-slate-50/70 p-4">
                                {loading ? (
                                    <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
                                ) : categoryChartData.length > 0 ? (
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={categoryChartData} layout="vertical" margin={{ left: 16, right: 12 }}>
                                                <defs>
                                                    <linearGradient id="statsCategoryGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#2dd4bf" />
                                                        <stop offset="100%" stopColor="#0f766e" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" horizontal={false} />
                                                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#334155", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<ChartTooltip formatter={(value, name) => name === "Doanh thu" ? formatCurrency(value) : `${value} phần`} />} />
                                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                                <Bar dataKey="soldQuantity" name="Số lượng bán" fill="url(#statsCategoryGradient)" radius={[0, 10, 10, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                                        Chưa có dữ liệu danh mục theo kỳ.
                                    </div>
                                )}
                            </div>
                        </article>

                        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Voucher & Geography</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Voucher, thanh toán và khu vực giao hàng</h3>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Đơn dùng voucher</p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{voucherMetrics.ordersWithVoucher}</p>
                                    <p className="mt-1 text-xs text-slate-500">Tỷ lệ dùng {voucherMetrics.usageRate}%</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tổng giảm giá</p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(voucherMetrics.totalDiscount)}</p>
                                    <p className="mt-1 text-xs text-slate-500">{voucherMetrics.uniqueVouchers} mã được dùng</p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-3xl bg-slate-50/70 p-4">
                                {loading ? (
                                    <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
                                ) : paymentStatusChartData.length > 0 ? (
                                    <div className="h-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={paymentStatusChartData}>
                                                <defs>
                                                    <linearGradient id="statsPaymentStatusGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#818cf8" />
                                                        <stop offset="100%" stopColor="#4338ca" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<ChartTooltip formatter={(value) => `${value} đơn`} />} />
                                                <Bar dataKey="count" name="Số đơn" fill="url(#statsPaymentStatusGradient)" radius={[10, 10, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                                        Chưa có dữ liệu trạng thái thanh toán.
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Top khu vực giao hàng</p>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                                    ))
                                ) : wardDemand.length > 0 ? (
                                    wardDemand.map((item) => (
                                        <div key={item.wardName} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-sm font-semibold text-slate-900">{item.wardName}</p>
                                                <p className="text-sm text-slate-600">{item.orderCount} đơn</p>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">Doanh thu hoàn thành: {formatCurrency(item.revenue)}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                        Chưa có dữ liệu khu vực giao hàng.
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

export default StatisticsPage;