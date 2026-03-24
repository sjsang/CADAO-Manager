import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authApi from "../../api/authApi";

const Header = ({ activePage }) => {
    const navigate = useNavigate();

    const navItems = [
        { key: "home", label: "Trang chủ", path: "/" },
        { key: "menu", label: "Thực đơn", path: "/menus" },
        { key: "about", label: "Về chúng tôi", path: "/about" },
        { key: "contact", label: "Liên hệ", path: "/contact" }
    ];

    const [loggedInUser, setLoggedInUser] = useState(null);
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
            const token = sessionStorage.getItem("token");

            if (!token) {
                setLoggedInUser(null);
                return;
            }

            try {
                const payload = JSON.parse(atob(token.split(".")[1]));

                if (payload?.role !== "customer") {
                    setLoggedInUser(null);
                    return;
                }
            } catch {
                setLoggedInUser(null);
                return;
            }

            try {
                const response = await authApi.me();
                setLoggedInUser(
                    {
                        fullName: response.data?.full_name,
                        avatarUrl: response.data?.avatar_url
                    }
                );
            } catch (error) {
                console.error("Failed to fetch logged in user:", error);
            }
        }

        fetchLoggedInUser();
    }, []);

    return (
        <header
            className={`w-full text-white sticky top-0 left-0 z-50 transition-colors duration-500 ${isScrolled
                ? "bg-gray-900/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between py-4">

                <div
                    className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                    onClick={() => navigate("/")}
                >
                    <img
                        src="/logo.png"
                        className="w-15 h-15 object-cover drop-shadow-[0_6px_16px_rgba(234,179,8,0.25)]"
                        alt=""
                    />
                    <p className="font-bold text-xl tracking-wide">CA DAO</p>
                </div>

                <nav>
                    <ul className="flex items-center gap-8 font-medium">
                        {navItems.map((item) => {
                            const isActive = activePage === item.key;

                            return (
                                <li key={item.key}>
                                    <button
                                        type="button"
                                        onClick={() => navigate(item.path)}
                                        className={`group relative cursor-pointer pb-1 transition-all duration-300 ${isActive ? "text-yellow-400" : "text-white/90 hover:text-yellow-300"}`}
                                    >
                                        {item.label}
                                        <span
                                            className={`absolute left-0 -bottom-0.5 h-0.5 w-full origin-left bg-yellow-400 transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                                        />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="flex items-center gap-4">
                    <div
                        className="w-10 h-10 bg-gray-700/90 text-lg rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-yellow-500 hover:text-black"
                        onClick={() => navigate("/cart-items")}
                    >
                        <i className="fa-solid fa-bag-shopping"></i>
                    </div>
                    <div>
                        {loggedInUser
                            ? <img
                                src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${loggedInUser?.avatarUrl}`}
                                alt={loggedInUser?.fullName}
                                onClick={() => navigate("/customers/me")}
                                className="w-10 h-10 rounded-full object-cover cursor-pointer ring-2 ring-transparent transition-all duration-300 hover:-translate-y-0.5 hover:ring-yellow-400"
                            />
                            : <div
                                className="w-10 h-10 bg-gray-700/90 text-lg rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-yellow-500 hover:text-black"
                                onClick={() => navigate("/auth/login")}
                            >
                                <i className="fa-solid fa-user"></i>
                            </div>}
                    </div>
                </div>

            </div>
        </header>
    );
};

export default Header;