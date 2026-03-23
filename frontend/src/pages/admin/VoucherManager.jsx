import { useEffect, useMemo, useState } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import SideBarMenu from "../../components/admin/SideBarMenu";
import TablePagination from "../../components/admin/TablePagination";
import voucherApi from "../../api/voucherApi";
import { formatDateDDMMYYYY } from "../../functions/formatDate";

const PAGE_SIZE = 10;

const initialFormData = {
    code: "",
    discountType: "percent",
    discountPercent: "",
    discountAmount: "",
    minOrderValue: "",
    maxDiscount: "",
    expiryDate: "",
    usageLimit: "",
    isActive: true
};

const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || fallbackMessage;
};

const toDateInputDDMMYYYY = (value) => {
    if (!value) {
        return "";
    }

    const formatted = formatDateDDMMYYYY(value);
    return formatted === "-" ? "" : formatted;
};

const parseDateFromDDMMYYYY = (value) => {
    const normalized = String(value || "").trim();

    if (!normalized) {
        return null;
    }

    const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return `${String(year)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const formatCurrency = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
};

const VoucherManager = () => {
    const [vouchers, setVouchers] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
    const [formData, setFormData] = useState(initialFormData);
    const [editingVoucherId, setEditingVoucherId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

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

    const stats = useMemo(() => {
        const activeCount = vouchers.filter((voucher) => voucher.is_active).length;
        const expiredCount = vouchers.filter((voucher) => {
            if (!voucher.expiry_date) {
                return false;
            }
            return new Date(voucher.expiry_date).getTime() < Date.now();
        }).length;

        return {
            activeCount,
            expiredCount
        };
    }, [vouchers]);

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingVoucherId(null);
    };

    const refreshVouchers = async (successMessage) => {
        await fetchVouchers();

        if (successMessage) {
            setFeedback({
                type: "success",
                message: successMessage
            });
        }
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((prev) => {
            if (name === "discountType") {
                return {
                    ...prev,
                    discountType: value,
                    discountPercent: value === "percent" ? prev.discountPercent : "",
                    discountAmount: value === "amount" ? prev.discountAmount : "",
                    maxDiscount: value === "percent" ? prev.maxDiscount : ""
                };
            }

            return {
                ...prev,
                [name]: type === "checkbox" ? checked : value
            };
        });
    };

    const handleEdit = (voucher) => {
        const discountType = voucher.discount_percent !== null ? "percent" : "amount";

        setEditingVoucherId(voucher.id);
        setFormData({
            code: voucher.code || "",
            discountType,
            discountPercent: voucher.discount_percent ?? "",
            discountAmount: voucher.discount_amount ?? "",
            minOrderValue: voucher.min_order_value ?? "",
            maxDiscount: voucher.max_discount ?? "",
            expiryDate: toDateInputDDMMYYYY(voucher.expiry_date),
            usageLimit: voucher.usage_limit ?? "",
            isActive: Boolean(voucher.is_active)
        });
        setFeedback(null);
    };

    const buildPayload = () => {
        const parsedExpiryDate = parseDateFromDDMMYYYY(formData.expiryDate);

        if (formData.expiryDate && !parsedExpiryDate) {
            throw new Error("Ngày hết hạn phải đúng định dạng dd/mm/yyyy.");
        }

        return {
            code: formData.code,
            discountPercent: formData.discountType === "percent" ? formData.discountPercent : null,
            discountAmount: formData.discountType === "amount" ? formData.discountAmount : null,
            minOrderValue: formData.minOrderValue,
            maxDiscount: formData.discountType === "percent" ? formData.maxDiscount : null,
            expiryDate: parsedExpiryDate,
            usageLimit: formData.usageLimit || null,
            isActive: formData.isActive
        };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        try {
            const payload = buildPayload();

            if (editingVoucherId) {
                await voucherApi.updateVoucher(editingVoucherId, payload);
                await refreshVouchers("Cập nhật voucher thành công.");
            } else {
                await voucherApi.createVoucher(payload);
                await refreshVouchers("Thêm voucher mới thành công.");
            }

            resetForm();
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể lưu thông tin voucher.")
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (voucher) => {
        const confirmed = window.confirm(`Xóa voucher \"${voucher.code}\"?`);

        if (!confirmed) {
            return;
        }

        setFeedback(null);

        try {
            await voucherApi.deleteVoucher(voucher.id);

            if (editingVoucherId === voucher.id) {
                resetForm();
            }

            await refreshVouchers("Xóa voucher thành công.");
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể xóa voucher.")
            });
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
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700">
                                    Tổng voucher: <strong>{vouchers.length}</strong>
                                </span>
                                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                                    Đang hoạt động: <strong>{stats.activeCount}</strong>
                                </span>
                                <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-2 text-amber-700">
                                    Hết hạn: <strong>{stats.expiredCount}</strong>
                                </span>
                            </div>
                        </div>

                        {feedback ? (
                            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                                {feedback.message}
                            </div>
                        ) : null}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <p className="text-xs font-semibold tracking-[0.2em] text-blue-500 uppercase">Biểu mẫu</p>
                                <h2 className="mt-2 text-xl font-bold text-slate-800">
                                    {editingVoucherId ? "Cập nhật voucher" : "Thêm voucher mới"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Chọn loại giảm giá và cấu hình giới hạn để kiểm soát chương trình khuyến mãi.
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Mã voucher</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: TET2026"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Loại giảm giá</label>
                                    <select
                                        name="discountType"
                                        value={formData.discountType}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        <option value="percent">Giảm theo phần trăm</option>
                                        <option value="amount">Giảm số tiền cố định</option>
                                    </select>
                                </div>

                                {formData.discountType === "percent" ? (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Phần trăm giảm (%)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            name="discountPercent"
                                            value={formData.discountPercent}
                                            onChange={handleChange}
                                            placeholder="Ví dụ: 15"
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Số tiền giảm</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1000"
                                            name="discountAmount"
                                            value={formData.discountAmount}
                                            onChange={handleChange}
                                            placeholder="Ví dụ: 30000"
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Giá trị đơn tối thiểu</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        name="minOrderValue"
                                        value={formData.minOrderValue}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: 100000"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>

                                {formData.discountType === "percent" ? (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Giảm tối đa (không bắt buộc)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            name="maxDiscount"
                                            value={formData.maxDiscount}
                                            onChange={handleChange}
                                            placeholder="Ví dụ: 50000"
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                ) : null}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Ngày hết hạn (không bắt buộc)</label>
                                    <input
                                        type="text"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: 31/12/2026"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Giới hạn sử dụng (không bắt buộc)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        name="usageLimit"
                                        value={formData.usageLimit}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: 200"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>

                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    Kích hoạt voucher
                                </label>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Đang lưu..." : editingVoucherId ? "Lưu thay đổi" : "Thêm voucher"}
                                    </button>
                                    {editingVoucherId ? (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                                        >Hủy</button>
                                    ) : null}
                                </div>
                            </form>
                        </article>

                        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h2 className="text-lg font-semibold text-slate-800">Danh sách voucher</h2>
                                <p className="mt-1 text-sm text-slate-500">Theo dõi hiệu lực mã giảm giá và cập nhật nhanh khi cần.</p>
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
                                                <tr key={voucher.id} className="hover:bg-slate-50">
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
                                                                onClick={() => handleEdit(voucher)}
                                                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 transition hover:bg-blue-100"
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(voucher)}
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
                        </article>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default VoucherManager;
