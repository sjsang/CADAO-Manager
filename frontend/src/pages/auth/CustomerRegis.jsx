import { useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';

const CustomerRegis = () => {
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            await authApi.register({
                full_name: formData.get('full_name'),
                phone_number: formData.get('phone_number'),
                email: formData.get('email'),
                password: formData.get('password')
            });
            navigate('/login');
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    return (
        // <div className='text-white'>
        //     <h1>Customer Registration Page</h1>
        //     {/* Registration form goes here */}
        //     <button onClick={() => navigate('/login')}>Already have an account? Login here</button>

        //     <form onSubmit={handleRegister}>
        //         <input type="text" name="full_name" placeholder='Full Name' />
        //         <input type="text" name="phone_number" placeholder='Phone Number' />
        //         <input type="email" name="email" placeholder='Email' />
        //         <input type="password" name="password" placeholder='Password' />
        //         <button type='submit'>Register</button>
        //     </form>
        // </div>
        <div className='flex flex-col items-center justify-center text-white h-screen gap-4'>
            <h1 className='text-2xl font-bold'>Đăng ký</h1>
            <form onSubmit={handleRegister} className='flex flex-col gap-4 w-80'>
                <input
                    type="text"
                    name="full_name"
                    placeholder='Họ và tên'
                    className='p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <input
                    type="text"
                    name="phone_number"
                    placeholder='Số điện thoại'
                    className='p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
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
                <button type='submit' className='bg-green-500 text-white p-2 rounded'>Đăng ký</button>
            </form>
            <button onClick={() => navigate('/login')} className='text-blue-500'>Đã có tài khoản? Đăng nhập tại đây</button>
        </div>
    );
}

export default CustomerRegis;