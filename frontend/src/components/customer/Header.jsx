import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authApi from "../../api/authApi";

const Header = ({ activePage }) => {
    const navigate = useNavigate();

    const activeClass = 'text-yellow-500';

    const [loggedInUser, setLoggedInUser] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        const fetchLoggedInUser = async () => {
            try {
                const response = await authApi.me();
                setLoggedInUser(response.data.full_name);
            } catch (error) {
                console.error("Failed to fetch logged in user:", error);
            }
        }

        fetchLoggedInUser();
    }, []);


    return (
        <header className={`w-full text-white sticky top-0 left-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900 shadow-lg' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between py-4">

                <div className="text-2xl text-yellow-500 font-bold tracking-wide">CADAO</div>

                <nav>
                    <ul className="flex items-center gap-8 font-medium">
                        <li>
                            <a
                                onClick={() => navigate("/")}
                                className={`cursor-pointer ${activePage === "home" ? activeClass : "hover:text-yellow-500 transition"}`}>
                                Trang chủ
                            </a>
                        </li>

                        <li>
                            <a
                                onClick={() => navigate("/menu")}
                                className={`cursor-pointer ${activePage === "menu" ? activeClass : "hover:text-yellow-500 transition"}`}>
                                Thực đơn
                            </a>
                        </li>

                        <li>
                            <a
                                onClick={() => navigate("/cart")}
                                className={`cursor-pointer ${activePage === "cart" ? activeClass : "hover:text-yellow-500 transition"}`}>
                                Giỏ hàng
                            </a>
                        </li>

                        <li>
                            <a
                                onClick={() => navigate("/about")}
                                className={`cursor-pointer ${activePage === "about" ? activeClass : "hover:text-yellow-500 transition"}`}>
                                Về chúng tôi
                            </a>
                        </li>

                        <li>
                            <a
                                onClick={() => navigate("/contact")}
                                className={`cursor-pointer ${activePage === "contact" ? activeClass : "hover:text-yellow-500 transition"}`}>
                                Liên hệ
                            </a>
                        </li>

                        <li>
                            {loggedInUser
                                ? <a
                                    onClick={() => navigate("/me")}
                                    className="bg-yellow-500 hover:bg-yellow-300 transition px-4 py-2 rounded text-black cursor-pointer"
                                >
                                    {loggedInUser}
                                </a>
                                : <a
                                    onClick={() => navigate("/login")}
                                    className="bg-yellow-500 hover:bg-yellow-300 transition px-4 py-2 rounded text-black cursor-pointer"
                                >
                                    Đăng nhập
                                </a>}
                        </li>
                    </ul>
                </nav>

            </div>
        </header>
    );
};

export default Header;