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
        <div className='text-white'>
            <h1>Customer Registration Page</h1>
            {/* Registration form goes here */}
            <button onClick={() => navigate('/login')}>Already have an account? Login here</button>

            <form onSubmit={handleRegister}>
                <input type="text" name="full_name" placeholder='Full Name' />
                <input type="text" name="phone_number" placeholder='Phone Number' />
                <input type="email" name="email" placeholder='Email' />
                <input type="password" name="password" placeholder='Password' />
                <button type='submit'>Register</button>
            </form>
        </div>
    );
}

export default CustomerRegis;