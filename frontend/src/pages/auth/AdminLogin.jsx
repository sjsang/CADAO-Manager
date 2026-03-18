const AdminLogin = () => {
    return (
        <div className='flex flex-col items-center justify-center text-white h-screen gap-4'>
            <div>
                <h1 className='text-2xl font-bold mb-1'>Đăng nhập</h1>
                <small className="text-gray-400">Dành cho nhân viên</small>
            </div>
            <form className='flex flex-col gap-4 w-80'>
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
            <button className='text-blue-500'>Chưa có tài khoản? Đăng ký tại đây</button>
        </div>
    );
}

export default AdminLogin;