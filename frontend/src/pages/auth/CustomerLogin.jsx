import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import { notifyCustomer } from "../../utils/customerNotify";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";

const CustomerLogin = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const validateForm = () => {
        const nextErrors = {};
        const normalizedEmail = form.email.trim().toLowerCase();

        if (!normalizedEmail) {
            nextErrors.email = "Vui lòng nhập email.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            nextErrors.email = "Email không hợp lệ.";
        }

        if (!form.password) {
            nextErrors.password = "Vui lòng nhập mật khẩu.";
        }

        return nextErrors;
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const nextErrors = validateForm();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            notifyCustomer({ message: "Vui lòng kiểm tra lại thông tin đăng nhập.", type: "warning" });
            return;
        }

        setSubmitting(true);

        try {
            const response = await authApi.login({
                email: form.email.trim().toLowerCase(),
                password: form.password
            });

            sessionStorage.setItem("token", response.data.token);
            window.dispatchEvent(new Event("authChanged"));
            notifyCustomer({ message: "Đăng nhập thành công.", type: "success" });
            navigate('/');
        } catch (error) {
            console.error("Login failed:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.",
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
            title="Đăng nhập"
            subtitle="Truy cập lịch sử đơn hàng, giỏ hàng và ưu đãi dành riêng cho bạn."
            footer={(
                <>
                    <button
                        onClick={() => navigate('/auth/register')}
                        className="text-[#e4c590] transition-colors hover:text-[#f4d9a8] hover:underline cursor-pointer"
                    >
                        Chưa có tài khoản? Đăng ký tại đây
                    </button>
                </>
            )}
        >
            <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
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

                <button
                    type='submit'
                    disabled={submitting}
                    className="group mt-2 rounded-xl border border-[#e4c590]/60 bg-black/35 px-4 py-2.5 font-semibold text-[#e4c590] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e4c590] hover:text-black disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>
        </AuthLayout>
    );
}

export default CustomerLogin;