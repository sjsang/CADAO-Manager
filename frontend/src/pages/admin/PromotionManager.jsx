import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import TablePagination from "../../components/admin/TablePagination";
import promotionApi from "../../api/promotionApi";
import ConfirmModal from "../../components/admin/modals/ConfirmModal";

const PAGE_SIZE = 10;

const getPromotionStatus = (promo) => {
    const now = new Date();
    const start = new Date(promo.start_time);
    const end = new Date(promo.end_time);
    if (!promo.is_active) return { label: "Tắt", color: "bg-slate-100 text-slate-600" };
    if (now < start) return { label: "Sắp diễn ra", color: "bg-blue-100 text-blue-700" };
    if (now > end) return { label: "Hết hạn", color: "bg-rose-100 text-rose-700" };
    return { label: "Đang hoạt động", color: "bg-green-100 text-green-700" };
};

const PromotionManager = () => {
    const navigate = useNavigate();

    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [deletingPromotion, setDeletingPromotion] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sortBy, setSortBy] = useState("start_time");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });

    const fetchPromotions = async ({ showLoading = false } = {}) => {
        if (showLoading) setLoading(true);
        try {
            const response = await promotionApi.getAll({ search, status, sortBy, sortDir, page, limit: PAGE_SIZE });
            setPromotions(response.data?.data || []);
            setPagination(response.data?.pagination || { page, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
        } catch {
            setFeedback({ type: "error", message: "Không thể tải danh sách khuyến mãi." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions({ showLoading: true });
    }, [search, status, sortBy, sortDir, page]);

    useEffect(() => {
        setPage(1);
    }, [search, status, sortBy, sortDir]);

    const handleToggle = async (id) => {
        try {
            await promotionApi.toggle(id);
            fetchPromotions();
        } catch {
            setFeedback({ type: "error", message: "Có lỗi khi thay đổi trạng thái khuyến mãi." });
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingPromotion) return;
        setIsDeleting(true);
        setFeedback(null);
        try {
            await promotionApi.delete(deletingPromotion.id);
            await fetchPromotions();
            setFeedback({ type: "success", message: "Xóa khuyến mãi thành công." });
            setDeletingPromotion(null);
        } catch {
            setFeedback({ type: "error", message: "Có lỗi khi xóa khuyến mãi." });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="promotions" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý khuyến mãi"
                    subtitle="Tạo, chỉnh sửa và quản lý các chương trình khuyến mãi."
                />

                <main className="p-6">
                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm khuyến mãi theo tên..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="upcoming">Sắp diễn ra</option>
                                    <option value="expired">Hết hạn</option>
                                    <option value="inactive">Tắt</option>
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="start_time">Sắp xếp: Ngày bắt đầu</option>
                                    <option value="end_time">Sắp xếp: Ngày kết thúc</option>
                                    <option value="name">Sắp xếp: Tên</option>
                                    <option value="created_at">Sắp xếp: Mới nhất</option>
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
                                    className="rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600"
                                    onClick={() => navigate("/admin/promotions/add")}
                                >
                                    Thêm khuyến mãi
                                </button>
                            </div>
                        </div>

                        {feedback ? (
                            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                                {feedback.message}
                            </div>
                        ) : null}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-800">Các chương trình khuyến mãi</h2>
                            <p className="mt-1 text-sm text-slate-500">Nhấn Sửa để chỉnh sửa hoặc nhấn vào hàng để xem chi tiết.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="w-60 px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tên chương trình</th>
                                        <th className="w-80 px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Mô tả</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Giảm giá</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày bắt đầu</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày kết thúc</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Áp dụng cho</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Đang tải danh sách khuyến mãi...
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!loading && promotions.map((promotion, index) => {
                                        const status = getPromotionStatus(promotion);
                                        return (
                                            <tr
                                                key={promotion.id}
                                                className="hover:bg-slate-50 cursor-pointer"
                                                onClick={() => navigate(`/admin/promotions/${promotion.id}`)}
                                            >
                                                <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-semibold tracking-wide text-slate-800 uppercase">{promotion.name}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{promotion.description}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {promotion.discount_percent
                                                        ? `${promotion.discount_percent}%`
                                                        : promotion.discount_amount
                                                            ? `${Number(promotion.discount_amount).toLocaleString("vi-VN")} VNĐ`
                                                            : "N/A"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{new Date(promotion.start_time).toLocaleDateString("vi-VN")}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{new Date(promotion.end_time).toLocaleDateString("vi-VN")}</td>
                                                <td className="px-4 py-3 text-xs text-slate-700">
                                                    {promotion.menu_types.length > 0 ? (
                                                        <ul className="space-y-1">
                                                            {promotion.menu_types.map((type) => (
                                                                <li className="bg-blue-50 rounded-lg px-3 py-1 border border-blue-200 text-blue-700" key={type.id}>{type.name}</li>
                                                            ))}
                                                        </ul>
                                                    ) : null}
                                                    {promotion.categories.length > 0 ? (
                                                        <ul className="space-y-1">
                                                            {promotion.categories.map((cat) => (
                                                                <li className="bg-green-50 rounded-lg px-3 py-1 border border-green-200 text-green-700" key={cat.id}>{cat.name}</li>
                                                            ))}
                                                        </ul>
                                                    ) : null}
                                                    {promotion.menu_items.length > 0 ? (
                                                        <ul className="space-y-1">
                                                            {promotion.menu_items.map((item) => (
                                                                <li className="bg-amber-50 rounded-lg px-3 py-1 border border-amber-200 text-amber-700" key={item.id}>{item.name}</li>
                                                            ))}
                                                        </ul>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleToggle(promotion.id); }}
                                                            className={`rounded-lg border px-3 py-1.5 font-medium transition ${promotion.is_active
                                                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                                : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"}`}
                                                        >
                                                            {promotion.is_active ? "Tắt" : "Bật"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/promotions/${promotion.id}`); }}
                                                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 transition hover:bg-blue-100"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setDeletingPromotion(promotion); }}
                                                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 transition hover:bg-rose-100"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {!loading && promotions.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có chương trình khuyến mãi phù hợp.
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
                    </section>
                </main>
            </div>

            <ConfirmModal
                isOpen={Boolean(deletingPromotion)}
                title="Xác nhận xóa khuyến mãi"
                description={deletingPromotion ? `Bạn có chắc muốn xóa chương trình "${deletingPromotion.name}"? Hành động này không thể hoàn tác.` : ""}
                confirmText="Xóa khuyến mãi"
                cancelText="Giữ lại"
                tone="danger"
                busy={isDeleting}
                onClose={() => setDeletingPromotion(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default PromotionManager;