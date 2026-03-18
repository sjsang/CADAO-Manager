import { useNavigate } from 'react-router-dom';
import authApi from '../../api/auth.Api';

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
        <div className='text-white'>
            <h1>Customer Login Page</h1>
            {/* Login form goes here */}
            <button onClick={() => navigate('/register')}>Don't have an account? Register here</button>


            <form onSubmit={handleLogin}>
                <input type="email" name="email" placeholder='Email' />
                <input type="password" name="password" placeholder='Password' />
                <button type='submit'>Login</button>
            </form>
        </div>
    );
}

export default CustomerLogin;