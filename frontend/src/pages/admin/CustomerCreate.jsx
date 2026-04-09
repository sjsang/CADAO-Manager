import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import customerApi from "../../api/customerApi";
import { notifyCustomer } from "../../utils/customerNotify";

const CustomerCreate = () => {
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        full_name: "",
        phone_number: "",
        email: "",
        password: ""
    });

    const onFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.full_name.trim()) {
            newErrors.full_name = "Họ và tên không được để trống.";
        }

        if (!form.phone_number.trim()) {
            newErrors.phone_number = "Số điện thoại không được để trống.";
        }

        if (!form.password) {
            newErrors.password = "Mật khẩu không được để trống.";
        } else if (form.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
        }

        if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            newErrors.email = "Email không hợp lệ.";
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
            await customerApi.create({
                full_name: form.full_name.trim(),
                phone_number: form.phone_number.trim(),
                email: form.email.trim() || undefined,
                password: form.password
            });

            notifyCustomer({ message: "Thêm khách hàng thành công.", type: "success" });
            navigate("/admin/customers");
        } catch (error) {
            const message = error.response?.data?.message || "Không thể thêm khách hàng. Vui lòng thử lại.";
            notifyCustomer({ message, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (field) =>
        `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${errors[field]
            ? "border-rose-400 bg-rose-50 focus:ring-rose-300"
            : "border-slate-300 bg-white focus:ring-blue-300"
        }`;

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="customers" />

            <div className="flex-1">
                <AdminHeader
                    title="Thêm khách hàng mới"
                    subtitle="Tạo tài khoản khách hàng từ trang quản trị."
                />

                <div className="p-6">
                    <button
                        onClick={() => navigate("/admin/customers")}
                        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>

                    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin khách hàng</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Nhập thông tin cơ bản để tạo tài khoản cho khách hàng.
                            </p>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Họ và tên <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.full_name}
                                        onChange={(e) => onFieldChange("full_name", e.target.value)}
                                        className={inputClass("full_name")}
                                        placeholder="Nhập họ tên khách hàng"
                                    />
                                    {errors.full_name ? <p className="mt-1 text-sm text-rose-600">{errors.full_name}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Số điện thoại <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.phone_number}
                                        onChange={(e) => onFieldChange("phone_number", e.target.value)}
                                        className={inputClass("phone_number")}
                                        placeholder="Nhập số điện thoại"
                                    />
                                    {errors.phone_number ? <p className="mt-1 text-sm text-rose-600">{errors.phone_number}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Email <span className="text-slate-400">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => onFieldChange("email", e.target.value)}
                                        className={inputClass("email")}
                                        placeholder="Nhập email"
                                    />
                                    {errors.email ? <p className="mt-1 text-sm text-rose-600">{errors.email}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Mật khẩu <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => onFieldChange("password", e.target.value)}
                                        className={inputClass("password")}
                                        placeholder="Tối thiểu 6 ký tự"
                                    />
                                    {errors.password ? <p className="mt-1 text-sm text-rose-600">{errors.password}</p> : null}
                                </div>
                            </div>
                        </section>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/customers")}
                                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? "Đang tạo..." : "Tạo khách hàng"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerCreate;
