import { Link, useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';

const CustomerLogin = () => {
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const response = await authApi.login({
                email: formData.get('email'),
                password: formData.get('password')
            });

            sessionStorage.setItem("token", response.data.token);
            navigate('/');
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className='relative flex min-h-screen items-center justify-center px-4 py-8 text-white'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_80%_85%,rgba(20,184,166,0.2),transparent_35%)]' />

            <div className='relative w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/70 p-7 shadow-[0_20px_60px_rgba(2,6,23,0.55)] backdrop-blur-lg sm:p-8'>
                <Link
                    to='/'
                    aria-label='Quay về trang chủ'
                    className='absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-slate-900/80 text-2xl leading-none text-white transition hover:scale-105 hover:border-cyan-300 hover:text-cyan-200'
                >
                    ×
                </Link>
                <p className='mb-2 text-xs tracking-[0.24em] text-cyan-300/80 uppercase'>CADAO Customer</p>
                <h1 className='mb-1 text-3xl font-extrabold text-white'>Đăng nhập</h1>
                <p className='mb-6 text-sm text-slate-300'>Truy cập lịch sử đơn hàng, giỏ hàng và ưu đãi dành riêng cho bạn.</p>

                <form onSubmit={handleLogin} className='flex flex-col gap-4'>
                    <div className='space-y-1'>
                        <label htmlFor='email' className='text-sm font-medium text-slate-200'>Email</label>
                        <input
                            id='email'
                            type='email'
                            name='email'
                            placeholder='you@example.com'
                            className='w-full rounded-xl border border-slate-500/70 bg-slate-800/90 px-4 py-2.5 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40'
                        />
                    </div>

                    <div className='space-y-1'>
                        <label htmlFor='password' className='text-sm font-medium text-slate-200'>Mật khẩu</label>
                        <input
                            id='password'
                            type='password'
                            name='password'
                            placeholder='••••••••'
                            className='w-full rounded-xl border border-slate-500/70 bg-slate-800/90 px-4 py-2.5 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40'
                        />
                    </div>

                    <button
                        type='submit'
                        className='mt-2 rounded-xl bg-linear-to-r from-cyan-500 to-teal-500 px-4 py-2.5 font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400'
                    >
                        Đăng nhập
                    </button>
                </form>

                <div className='mt-5 space-y-2 text-sm'>
                    <button
                        onClick={() => navigate('/auth/register')}
                        className='text-cyan-300 transition-colors hover:text-cyan-200'
                    >
                        Chưa có tài khoản? Đăng ký tại đây
                    </button>
                    <div>
                        <Link to='/admin/login' className='text-teal-300 transition-colors hover:text-teal-200'>
                            Bạn là nhân viên? Đăng nhập tại đây
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustomerLogin;