import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import { notifyCustomer } from "../../utils/customerNotify";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";

const CustomerRegis = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        full_name: "",
        phone_number: "",
        email: "",
        password: "",
        confirm_password: ""
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const validateForm = () => {
        const nextErrors = {};

        if (!form.full_name.trim()) {
            nextErrors.full_name = "Vui lòng nhập họ tên.";
        } else if (form.full_name.trim().length < 2) {
            nextErrors.full_name = "Họ tên phải có ít nhất 2 ký tự.";
        }

        const normalizedPhone = form.phone_number.trim();
        if (!normalizedPhone) {
            nextErrors.phone_number = "Vui lòng nhập số điện thoại.";
        } else if (!/^((\+84)|0)(3|5|7|8|9)[0-9]{8}$/.test(normalizedPhone)) {
            nextErrors.phone_number = "Số điện thoại không hợp lệ.";
        }

        const normalizedEmail = form.email.trim().toLowerCase();
        if (!normalizedEmail) {
            nextErrors.email = "Vui lòng nhập email.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            nextErrors.email = "Email không hợp lệ.";
        }

        if (!form.password) {
            nextErrors.password = "Vui lòng nhập mật khẩu.";
        } else if (form.password.length < 8) {
            nextErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])/.test(form.password)) {
            nextErrors.password = "Mật khẩu cần chữ hoa, chữ thường, số và ký tự đặc biệt.";
        }

        if (!form.confirm_password) {
            nextErrors.confirm_password = "Vui lòng nhập lại mật khẩu.";
        } else if (form.confirm_password !== form.password) {
            nextErrors.confirm_password = "Mật khẩu nhập lại không khớp.";
        }

        return nextErrors;
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const nextErrors = validateForm();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            notifyCustomer({ message: "Vui lòng kiểm tra lại thông tin đăng ký.", type: "warning" });
            return;
        }

        setSubmitting(true);

        try {
            await authApi.register({
                full_name: form.full_name.trim(),
                phone_number: form.phone_number.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password
            });
            notifyCustomer({ message: "Đăng ký thành công! Hãy đăng nhập để tiếp tục.", type: "success" });
            navigate('/auth/login');
        } catch (error) {
            console.error("Registration failed:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.",
                type: "error"
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            mode="customer"
            closeTo="/"
            closeLabel="Quay về trang chủ"
            eyebrow="Ca Dao Account"
            title="Tạo tài khoản"
            subtitle="Đăng ký nhanh để đặt món, theo dõi đơn hàng và lưu thông tin giao hàng."
            footer={(
                <>
                    <button
                        onClick={() => navigate('/auth/login')}
                        className="text-[#e4c590] transition-colors hover:text-[#f4d9a8] hover:underline cursor-pointer"
                    >
                        Đã có tài khoản? Đăng nhập tại đây
                    </button>
                </>
            )}
        >
            <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
                <AuthField
                    id="full_name"
                    type="text"
                    name="full_name"
                    label="Họ và tên"
                    value={form.full_name}
                    onChange={handleFieldChange}
                    placeholder="Nguyen Van A"
                    error={errors.full_name}
                    mode="customer"
                />

                <AuthField
                    id="phone_number"
                    type="text"
                    name="phone_number"
                    label="Số điện thoại"
                    value={form.phone_number}
                    onChange={handleFieldChange}
                    placeholder="09xx xxx xxx"
                    error={errors.phone_number}
                    mode="customer"
                />

                <AuthField
                    id="email"
                    type="email"
                    name="email"
                    label="Email"
                    value={form.email}
                    onChange={handleFieldChange}
                    placeholder="you@example.com"
                    error={errors.email}
                    mode="customer"
                />

                <AuthField
                    id="password"
                    type="password"
                    name="password"
                    label="Mật khẩu"
                    value={form.password}
                    onChange={handleFieldChange}
                    placeholder="••••••••"
                    error={errors.password}
                    mode="customer"
                />

                <AuthField
                    id="confirm_password"
                    type="password"
                    name="confirm_password"
                    label="Nhập lại mật khẩu"
                    value={form.confirm_password}
                    onChange={handleFieldChange}
                    placeholder="••••••••"
                    error={errors.confirm_password}
                    mode="customer"
                />

                <button
                    type="submit"
                    disabled={submitting}
                    className="group mt-2 rounded-xl border border-[#e4c590]/60 bg-black/35 px-4 py-2.5 font-semibold text-[#e4c590] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e4c590] hover:text-black disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {submitting ? "Đang đăng ký..." : "Đăng ký"}
                </button>
            </form>
        </AuthLayout>
    );
}

export default CustomerRegis;