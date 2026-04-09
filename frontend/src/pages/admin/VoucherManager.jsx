import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader";
import SideBarMenu from "../../components/admin/SideBarMenu";
import TablePagination from "../../components/admin/TablePagination";
import voucherApi from "../../api/voucherApi";
import { formatDateDDMMYYYY } from "../../functions/formatDate";
import ConfirmModal from "../../components/admin/modals/ConfirmModal";

const PAGE_SIZE = 10;

const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || fallbackMessage;
};

const formatCurrency = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
};

const VoucherManager = () => {
    const navigate = useNavigate();

    const [vouchers, setVouchers] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);
    const [deletingVoucher, setDeletingVoucher] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchVouchers = async ({ showLoading = false } = {}) => {
        if (showLoading) {
            setIsLoading(true);
        }

        try {
            const response = await voucherApi.getVouchers({
                search,
                sortBy,
                sortDir,
                page,
                limit: PAGE_SIZE
            });

            setVouchers(response.data?.data || []);
            setPagination(response.data?.pagination || { page, limit: PAGE_SIZE, totalItems: (response.data?.data || []).length, totalPages: 1 });
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể tải danh sách voucher.")
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers({ showLoading: true });
    }, [search, sortBy, sortDir, page]);

    useEffect(() => {
        setPage(1);
    }, [search, sortBy, sortDir]);

    const handleConfirmDelete = async () => {
        if (!deletingVoucher) {
            return;
        }

        setIsDeleting(true);
        setFeedback(null);

        try {
            await voucherApi.deleteVoucher(deletingVoucher.id);
            await fetchVouchers();
            setFeedback({ type: "success", message: "Xóa voucher thành công." });
            setDeletingVoucher(null);
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể xóa voucher.")
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const getDiscountText = (voucher) => {
        if (voucher.discount_percent !== null) {
            const maxText = voucher.max_discount ? `, tối đa ${formatCurrency(voucher.max_discount)}` : "";
            return `${voucher.discount_percent}%${maxText}`;
        }

        return formatCurrency(voucher.discount_amount);
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="vouchers" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý voucher"
                    subtitle="Tạo mã giảm giá, giới hạn sử dụng và thời gian hiệu lực cho chương trình khuyến mãi."
                />

                <main className="p-6">
                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm voucher theo mã..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                    className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="created_at">Sắp xếp: Mới nhất</option>
                                    <option value="code">Sắp xếp: Mã voucher</option>
                                    <option value="expiry_date">Sắp xếp: Hạn dùng</option>
                                    <option value="used_count">Sắp xếp: Lượt sử dụng</option>
                                </select>

                                <select
                                    value={sortDir}
                                    onChange={(event) => setSortDir(event.target.value)}
                                    className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="asc">Tăng dần</option>
                                    <option value="desc">Giảm dần</option>
                                </select>

                                <button
                                    className="rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600"
                                    onClick={() => navigate("/admin/vouchers/add")}
                                >
                                    Thêm voucher
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
                            <h2 className="text-lg font-semibold text-slate-800">Danh sách voucher</h2>
                            <p className="mt-1 text-sm text-slate-500">Nhấn vào hàng để chỉnh sửa, theo dõi hiệu lực mã giảm giá.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Mã</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Giảm giá</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Đơn tối thiểu</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Sử dụng</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Hạn dùng</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Đang tải danh sách voucher...
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading && vouchers.map((voucher, index) => {
                                        const isExpired = voucher.expiry_date ? new Date(voucher.expiry_date).getTime() < Date.now() : false;

                                        return (
                                            <tr
                                                key={voucher.id}
                                                className="hover:bg-slate-50 cursor-pointer"
                                                onClick={() => navigate(`/admin/vouchers/${voucher.id}`)}
                                            >
                                                <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-semibold tracking-wide text-slate-800 uppercase">{voucher.code}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{getDiscountText(voucher)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(voucher.min_order_value)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{voucher.used_count}/{voucher.usage_limit || "∞"}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {voucher.expiry_date ? formatDateDDMMYYYY(voucher.expiry_date) : "Không giới hạn"}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${voucher.is_active && !isExpired ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}
                                                    >
                                                        {voucher.is_active && !isExpired ? "Hoạt động" : "Ngừng"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/admin/vouchers/${voucher.id}`);
                                                            }}
                                                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 transition hover:bg-blue-100"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeletingVoucher(voucher);
                                                            }}
                                                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 transition hover:bg-rose-100"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {!isLoading && vouchers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có voucher phù hợp với từ khóa tìm kiếm.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>

                        {!isLoading ? (
                            <TablePagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                totalItems={pagination.totalItems}
                                onPageChange={setPage}
                            />
                        ) : null}
                    </section>
                </main>
            </div>

            <ConfirmModal
                isOpen={Boolean(deletingVoucher)}
                title="Xác nhận xóa voucher"
                description={deletingVoucher ? `Bạn có chắc muốn xóa voucher "${deletingVoucher.code}"? Hành động này không thể hoàn tác.` : ""}
                confirmText="Xóa voucher"
                cancelText="Giữ lại"
                tone="danger"
                busy={isDeleting}
                onClose={() => setDeletingVoucher(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default VoucherManager;
