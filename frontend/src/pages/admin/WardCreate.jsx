import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import wardApi from "../../api/wardApi";
import { notifyCustomer } from "../../utils/customerNotify";

const WardCreate = () => {
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        name: "",
        shippingFee: ""
    });

    const onFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Tên phường không được để trống.";
        }

        const fee = Number(form.shippingFee);
        if (form.shippingFee === "" || !Number.isFinite(fee) || fee < 0) {
            newErrors.shippingFee = "Phí giao hàng phải lớn hơn hoặc bằng 0.";
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
            await wardApi.createWard({
                name: form.name.trim(),
                shippingFee: form.shippingFee
            });

            notifyCustomer({ message: "Thêm phường mới thành công.", type: "success" });
            navigate("/admin/wards");
        } catch (error) {
            const message = error.response?.data?.message || "Không thể thêm phường. Vui lòng thử lại.";
            notifyCustomer({ message, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="wards" />

            <div className="flex-1">
                <AdminHeader
                    title="Thêm phường mới"
                    subtitle="Thiết lập phường giao hàng và phí ship tương ứng."
                />

                <div className="p-6">
                    <button
                        onClick={() => navigate("/admin/wards")}
                        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>

                    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin phường</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Nhập tên phường và phí vận chuyển áp dụng cho đơn hàng giao đến khu vực đó.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tên phường</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => onFieldChange("name", e.target.value)}
                                        placeholder="Ví dụ: Phường 1"
                                        className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.name ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`}
                                    />
                                    {errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Phí giao hàng</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={form.shippingFee}
                                        onChange={(e) => onFieldChange("shippingFee", e.target.value)}
                                        placeholder="Ví dụ: 15000"
                                        className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.shippingFee ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`}
                                    />
                                    {errors.shippingFee ? <p className="mt-1 text-sm text-rose-600">{errors.shippingFee}</p> : null}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/wards")}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isSubmitting ? "Đang lưu..." : "Thêm phường"}
                                </button>
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WardCreate;
