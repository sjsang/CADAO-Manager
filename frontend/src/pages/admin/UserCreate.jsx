import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import userApi from "../../api/userApi";
import { notifyCustomer } from "../../utils/customerNotify";

const ROLE_OPTIONS = [
    { value: "admin", label: "Admin" },
    { value: "shipper", label: "Shipper" }
];

const UserCreate = () => {
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        username: "",
        full_name: "",
        phone_number: "",
        role: "shipper",
        password: ""
    });

    const onFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.username.trim()) {
            newErrors.username = "Username không được để trống.";
        }

        if (!form.role) {
            newErrors.role = "Vui lòng chọn vai trò.";
        }

        if (!form.password) {
            newErrors.password = "Mật khẩu không được để trống.";
        } else if (form.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
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
            await userApi.create({
                username: form.username.trim(),
                full_name: form.full_name.trim() || undefined,
                phone_number: form.phone_number.trim() || undefined,
                role: form.role,
                password: form.password
            });

            notifyCustomer({ message: "Thêm tài khoản thành công.", type: "success" });
            navigate("/admin/users");
        } catch (error) {
            const message = error.response?.data?.message || "Không thể thêm tài khoản. Vui lòng thử lại.";
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
            <SideBarMenu activePage="users" />

            <div className="flex-1">
                <AdminHeader
                    title="Thêm tài khoản mới"
                    subtitle="Tạo tài khoản admin hoặc shipper từ trang quản trị."
                />

                <div className="p-6">
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>

                    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin tài khoản</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Nhập thông tin để tạo tài khoản nhân sự mới cho hệ thống.
                            </p>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Username <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={(e) => onFieldChange("username", e.target.value)}
                                        className={inputClass("username")}
                                        placeholder="Nhập username"
                                    />
                                    {errors.username ? <p className="mt-1 text-sm text-rose-600">{errors.username}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Họ và tên <span className="text-slate-400">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.full_name}
                                        onChange={(e) => onFieldChange("full_name", e.target.value)}
                                        className={inputClass("full_name")}
                                        placeholder="Nhập họ tên"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Số điện thoại <span className="text-slate-400">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.phone_number}
                                        onChange={(e) => onFieldChange("phone_number", e.target.value)}
                                        className={inputClass("phone_number")}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Vai trò <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={form.role}
                                        onChange={(e) => onFieldChange("role", e.target.value)}
                                        className={inputClass("role")}
                                    >
                                        {ROLE_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                    {errors.role ? <p className="mt-1 text-sm text-rose-600">{errors.role}</p> : null}
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
                                onClick={() => navigate("/admin/users")}
                                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserCreate;
