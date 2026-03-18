import { useNavigate } from 'react-router-dom';
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
        <div className='flex flex-col items-center justify-center text-white h-screen gap-4'>
            <h1 className='text-2xl font-bold'>Đăng nhập</h1>
            <form onSubmit={handleLogin} className='flex flex-col gap-4 w-80'>
                <input
                    type="email"
                    name="email"
                    placeholder='Email'
                    className='p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <input
                    type="password"
                    name="password"
                    placeholder='Mật khẩu'
                    className='p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <button type='submit' className='bg-blue-500 text-white p-2 rounded'>Đăng nhập</button>
            </form>
            <button onClick={() => navigate('/register')} className='text-blue-500'>Chưa có tài khoản? Đăng ký tại đây</button>
        </div>
    );
}

export default CustomerLogin;