import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import { notifyCustomer } from "../../utils/customerNotify";

const AdminLogin = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const validateForm = () => {
        const nextErrors = {};

        if (!form.username.trim()) {
            nextErrors.username = "Vui long nhap ten dang nhap.";
        }

        if (!form.password) {
            nextErrors.password = "Vui long nhap mat khau.";
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
            notifyCustomer({ message: "Vui long kiem tra thong tin dang nhap.", type: "warning" });
            return;
        }

        setSubmitting(true);

        try {
            const response = await authApi.adminLogin({
                username: form.username.trim(),
                password: form.password
            });
            sessionStorage.setItem("token", response.data.token);
            window.dispatchEvent(new Event("authChanged"));

            const payload = JSON.parse(atob(response.data.token.split('.')[1] || ""));
            if (payload?.role === "shipper") {
                navigate('/shipper/deliveries');
                return;
            }

            navigate('/admin/dashboard');
        } catch (error) {
            console.error("Login failed:", error);
            notifyCustomer({
                message: error.response?.data?.error || error.response?.data?.message || "Dang nhap that bai.",
                type: "error"
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            mode="admin"
            closeTo="/"
            closeLabel="Quay về trang chủ"
            eyebrow="CADAO Portal"
            title="Đăng nhập quản trị"
            subtitle="Dành cho quản trị viên và shipper vận hành hệ thống."
        >
            <form onSubmit={handleLogin} className='flex flex-col gap-4' noValidate>
                <AuthField
                    id='username'
                    type='text'
                    name='username'
                    label='Tên đăng nhập'
                    value={form.username}
                    onChange={handleFieldChange}
                    placeholder='Nhập tên đăng nhập'
                    error={errors.username}
                    mode='admin'
                />

                <AuthField
                    id='password'
                    type='password'
                    name='password'
                    label='Mật khẩu'
                    value={form.password}
                    onChange={handleFieldChange}
                    placeholder='••••••••'
                    error={errors.password}
                    mode='admin'
                />

                <button
                    type='submit'
                    disabled={submitting}
                    className='mt-2 rounded-xl bg-linear-to-r from-sky-500 to-emerald-500 px-4 py-2.5 font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:from-sky-400 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-70'
                >
                    {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>
        </AuthLayout>
    );
}

export default AdminLogin;