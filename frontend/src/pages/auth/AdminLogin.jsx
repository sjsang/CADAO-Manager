import { Link, useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';

const AdminLogin = () => {
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const response = await authApi.adminLogin({
                username: formData.get('username'),
                password: formData.get('password')
            });
            sessionStorage.setItem("token", response.data.token);

            const payload = JSON.parse(atob(response.data.token.split('.')[1] || ""));
            if (payload?.role === "staff") {
                navigate('/admin/orders');
                return;
            }
            if (payload?.role === "shipper") {
                navigate('/shipper/deliveries');
                return;
            }

            navigate('/admin/dashboard');
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className='relative flex min-h-screen items-center justify-center px-4 py-8 text-white'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.22),transparent_36%),radial-gradient(circle_at_84%_86%,rgba(16,185,129,0.2),transparent_35%)]' />

            <div className='relative w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/70 p-7 shadow-[0_20px_60px_rgba(2,6,23,0.55)] backdrop-blur-lg sm:p-8'>
                <Link
                    to='/'
                    aria-label='Quay về trang chủ'
                    className='absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-slate-900/80 text-2xl leading-none text-white transition hover:scale-105 hover:border-sky-300 hover:text-sky-200'
                >
                    ×
                </Link>
                <p className='mb-2 text-xs tracking-[0.24em] text-sky-300/80 uppercase'>CADAO Staff Portal</p>
                <h1 className='mb-1 text-3xl font-extrabold text-white'>Đăng nhập nhân viên</h1>
                <p className='mb-6 text-sm text-slate-300'>Dành cho quản trị viên và nhân viên vận hành hệ thống.</p>

                <form onSubmit={handleLogin} className='flex flex-col gap-4'>
                    <div className='space-y-1'>
                        <label htmlFor='username' className='text-sm font-medium text-slate-200'>Tên đăng nhập</label>
                        <input
                            id='username'
                            type='text'
                            name='username'
                            placeholder='Nhập tên đăng nhập'
                            className='w-full rounded-xl border border-slate-500/70 bg-slate-800/90 px-4 py-2.5 text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40'
                        />
                    </div>

                    <div className='space-y-1'>
                        <label htmlFor='password' className='text-sm font-medium text-slate-200'>Mật khẩu</label>
                        <input
                            id='password'
                            type='password'
                            name='password'
                            placeholder='••••••••'
                            className='w-full rounded-xl border border-slate-500/70 bg-slate-800/90 px-4 py-2.5 text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40'
                        />
                    </div>

                    <button
                        type='submit'
                        className='mt-2 rounded-xl bg-linear-to-r from-sky-500 to-emerald-500 px-4 py-2.5 font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:from-sky-400 hover:to-emerald-400'
                    >
                        Đăng nhập
                    </button>
                </form>

                <div className='mt-5 text-sm'>
                    <Link to='/auth/login' className='text-sky-300 transition-colors hover:text-sky-200'>
                        Quay lại đăng nhập khách hàng
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;