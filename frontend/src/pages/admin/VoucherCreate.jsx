import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import voucherApi from "../../api/voucherApi";
import { notifyCustomer } from "../../utils/customerNotify";

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

const VoucherCreate = () => {
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        code: "",
        discountType: "percent",
        discountPercent: "",
        discountAmount: "",
        minOrderValue: "",
        maxDiscount: "",
        expiryDate: "",
        usageLimit: "",
        isActive: true,
        applicableRank: "all"
    });

    const onFieldChange = (field, value) => {
        if (field === "discountType") {
            setForm((prev) => ({
                ...prev,
                discountType: value,
                discountPercent: value === "percent" ? prev.discountPercent : "",
                discountAmount: value === "amount" ? prev.discountAmount : "",
                maxDiscount: value === "percent" ? prev.maxDiscount : ""
            }));
        } else {
            setForm((prev) => ({ ...prev, [field]: value }));
        }

        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.code.trim()) {
            newErrors.code = "Mã voucher không được để trống.";
        }

        if (form.discountType === "percent") {
            const percent = Number(form.discountPercent);
            if (!form.discountPercent || !Number.isFinite(percent) || percent < 1 || percent > 100) {
                newErrors.discountPercent = "Phần trăm giảm phải từ 1 đến 100.";
            }
        } else {
            const amount = Number(form.discountAmount);
            if (!form.discountAmount || !Number.isFinite(amount) || amount <= 0) {
                newErrors.discountAmount = "Số tiền giảm phải lớn hơn 0.";
            }
        }

        if (form.minOrderValue) {
            const min = Number(form.minOrderValue);
            if (!Number.isFinite(min) || min < 0) {
                newErrors.minOrderValue = "Giá trị đơn tối thiểu không hợp lệ.";
            }
        }

        if (form.expiryDate && !parseDateFromDDMMYYYY(form.expiryDate)) {
            newErrors.expiryDate = "Ngày hết hạn phải đúng định dạng dd/mm/yyyy.";
        }

        if (form.usageLimit) {
            const limit = Number(form.usageLimit);
            if (!Number.isInteger(limit) || limit < 1) {
                newErrors.usageLimit = "Giới hạn sử dụng phải là số nguyên lớn hơn 0.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const parsedExpiryDate = parseDateFromDDMMYYYY(form.expiryDate);

            await voucherApi.createVoucher({
                code: form.code,
                discountPercent: form.discountType === "percent" ? form.discountPercent : null,
                discountAmount: form.discountType === "amount" ? form.discountAmount : null,
                minOrderValue: form.minOrderValue,
                maxDiscount: form.discountType === "percent" ? form.maxDiscount : null,
                expiryDate: parsedExpiryDate,
                usageLimit: form.usageLimit || null,
                isActive: form.isActive,
                applicableRank: form.applicableRank
            });

            notifyCustomer({ message: "Thêm voucher mới thành công.", type: "success" });
            navigate("/admin/vouchers");
        } catch (error) {
            const message = error.response?.data?.message || "Không thể thêm voucher. Vui lòng thử lại.";
            notifyCustomer({ message, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (field) =>
        `w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors[field] ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`;

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="vouchers" />

            <div className="flex-1">
                <AdminHeader
                    title="Thêm voucher mới"
                    subtitle="Tạo mã giảm giá mới cho chương trình khuyến mãi."
                />

                <div className="p-6">
                    <button
                        onClick={() => navigate("/admin/vouchers")}
                        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>

                    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin voucher</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Chọn loại giảm giá và cấu hình giới hạn để kiểm soát chương trình khuyến mãi.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Mã voucher</label>
                                        <input
                                            type="text"
                                            value={form.code}
                                            onChange={(e) => onFieldChange("code", e.target.value)}
                                            placeholder="Ví dụ: TET2026"
                                            className={`${inputClass("code")} uppercase`}
                                        />
                                        {errors.code ? <p className="mt-1 text-sm text-rose-600">{errors.code}</p> : null}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Loại giảm giá</label>
                                        <select
                                            value={form.discountType}
                                            onChange={(e) => onFieldChange("discountType", e.target.value)}
                                            className={inputClass("discountType")}
                                        >
                                            <option value="percent">Giảm theo phần trăm</option>
                                            <option value="amount">Giảm số tiền cố định</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {form.discountType === "percent" ? (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Phần trăm giảm (%)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={form.discountPercent}
                                                onChange={(e) => onFieldChange("discountPercent", e.target.value)}
                                                placeholder="Ví dụ: 15"
                                                className={inputClass("discountPercent")}
                                            />
                                            {errors.discountPercent ? <p className="mt-1 text-sm text-rose-600">{errors.discountPercent}</p> : null}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Số tiền giảm</label>
                                            <input
                                                type="number"
                                                min="1000"
                                                step="1000"
                                                value={form.discountAmount}
                                                onChange={(e) => onFieldChange("discountAmount", e.target.value)}
                                                placeholder="Ví dụ: 30000"
                                                className={inputClass("discountAmount")}
                                            />
                                            {errors.discountAmount ? <p className="mt-1 text-sm text-rose-600">{errors.discountAmount}</p> : null}
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Giá trị đơn tối thiểu</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={form.minOrderValue}
                                            onChange={(e) => onFieldChange("minOrderValue", e.target.value)}
                                            placeholder="Ví dụ: 100000"
                                            className={inputClass("minOrderValue")}
                                        />
                                        {errors.minOrderValue ? <p className="mt-1 text-sm text-rose-600">{errors.minOrderValue}</p> : null}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    {form.discountType === "percent" ? (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Giảm tối đa (không bắt buộc)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={form.maxDiscount}
                                                onChange={(e) => onFieldChange("maxDiscount", e.target.value)}
                                                placeholder="Ví dụ: 50000"
                                                className={inputClass("maxDiscount")}
                                            />
                                        </div>
                                    ) : null}

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Ngày hết hạn (không bắt buộc)</label>
                                        <input
                                            type="text"
                                            value={form.expiryDate}
                                            onChange={(e) => onFieldChange("expiryDate", e.target.value)}
                                            placeholder="Ví dụ: 31/12/2026"
                                            className={inputClass("expiryDate")}
                                        />
                                        {errors.expiryDate ? <p className="mt-1 text-sm text-rose-600">{errors.expiryDate}</p> : null}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Giới hạn sử dụng (không bắt buộc)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.usageLimit}
                                            onChange={(e) => onFieldChange("usageLimit", e.target.value)}
                                            placeholder="Ví dụ: 200"
                                            className={inputClass("usageLimit")}
                                        />
                                        {errors.usageLimit ? <p className="mt-1 text-sm text-rose-600">{errors.usageLimit}</p> : null}
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => onFieldChange("isActive", e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    Kích hoạt voucher
                                </label>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Áp dụng cho hạng khách hàng</label>
                                    <select
                                        value={form.applicableRank}
                                        onChange={(e) => onFieldChange("applicableRank", e.target.value)}
                                        className={inputClass("applicableRank")}
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="normal">Khách hàng mới</option>
                                        <option value="loyal">Khách hàng thân quen</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/vouchers")}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isSubmitting ? "Đang lưu..." : "Thêm voucher"}
                                </button>
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VoucherCreate;
