import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authApi from "../../api/authApi";
import cartApi from "../../api/cartApi";
import NotificationDropdown from "./NotificationDropdown";

const Header = ({ activePage }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { key: "home", label: "Trang chủ", path: "/" },
        { key: "menu", label: "Thực đơn", path: "/menus" },
        { key: "promotions", label: "Khuyến mãi", path: "/promotions" },
        { key: "about", label: "Về chúng tôi", path: "/about" },
        { key: "contact", label: "Liên hệ", path: "/contact" }
    ];

    const [loggedInUser, setLoggedInUser] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const handleNavigate = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const isNavItemActive = (item) => {
        if (item.path === "/") {
            return location.pathname === "/";
        }

        return location.pathname.startsWith(item.path);
    };

    const isCustomerToken = () => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            return false;
        }

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload?.role === "customer";
        } catch {
            return false;
        }
    };

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

    useEffect(() => {
        const fetchCartItems = async () => {
            if (!isCustomerToken()) {
                setCartCount(0);
                return;
            }

            try {
                const response = await cartApi.getAll();
                const items = response?.data?.items || [];
                const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                setCartCount(totalItems);
            } catch {
                setCartCount(0);
            }
        };

        fetchCartItems();

        // Listen for cart updates
        const handleCartUpdate = () => {
            fetchCartItems();
        };

        window.addEventListener("cartUpdated", handleCartUpdate);

        return () => {
            window.removeEventListener("cartUpdated", handleCartUpdate);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (!isMobileMenuOpen) {
            document.body.style.overflow = "";
            return;
        }

        document.body.style.overflow = "hidden";

        const handleEsc = (event) => {
            if (event.key === "Escape") {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener("keydown", handleEsc);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isMobileMenuOpen]);

    return (
        <header
            className={`w-full text-white sticky top-0 left-0 z-50 transition-transform duration-500 ${isMobileMenuOpen
                ? "bg-gray-950 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                : isScrolled
                    ? "bg-gray-950/80 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)] -translate-y-12"
                    : "bg-transparent"
                }`}
        >
            <div className="h-12 py-3 flex items-center justify-between text-sm border-b border-white/20 max-w-7xl mx-auto xl:px-0">
                <div className="flex gap-12 items-center">
                    <p><i className="fa-solid fa-location-dot mr-1"></i>02 Phan Văn Trị, Ninh Kiều, Cần Thơ</p>
                    <div className="w-2 h-2 border border-[#e4c590] rotate-45"></div>
                    <p><i className="fa-solid fa-clock mr-1"></i>06:00 đến 22:00</p>
                </div>
                <div className="flex gap-12 items-center">
                    <p><i className="fa-solid fa-phone mr-1"></i>090 103 39 99</p>
                    <div className="w-2 h-2 border border-[#e4c590] rotate-45"></div>
                    <p><i className="fa-solid fa-envelope mr-1"></i>cd@gmail.com</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto flex items-center justify-between p-3 xl:px-0">

                <button
                    type="button"
                    className="flex items-center justify-between gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c590] rounded-md"
                    onClick={() => handleNavigate("/")}
                    aria-label="Về trang chủ"
                >
                    <img
                        src="/logo.png"
                        className="w-10 h-10 object-cover drop-shadow-[0_6px_16px_rgba(234,179,8,0.25)]"
                        alt="Logo CD"
                    />
                    <p className="font-bold text-xl tracking-wide">CD</p>
                </button>

                <nav className="hidden md:block" aria-label="Điều hướng chính">
                    <ul className="flex items-center gap-8 font-medium">
                        {navItems.map((item) => {
                            const isActive = isNavItemActive(item) || activePage === item.key;

                            return (
                                <li key={item.key}>
                                    <button
                                        type="button"
                                        onClick={() => handleNavigate(item.path)}
                                        className={`group relative cursor-pointer pb-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c590] rounded-sm ${isActive ? "text-[#e4c590]" : "text-white/90 hover:text-yellow-300"}`}
                                    >
                                        {item.label}
                                        <span
                                            className={`absolute left-0 -bottom-0.5 h-0.5 w-full origin-left bg-[#e4c590] transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                                        />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="flex items-center gap-4">
                    {loggedInUser && <NotificationDropdown />}
                    <button
                        type="button"
                        className="relative w-10 h-10 text-[#e4c590] border-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e4c590] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c590]"
                        onClick={() => handleNavigate("/cart-items")}
                        aria-label="Giỏ hàng"
                    >
                        <i className="fa-solid fa-bag-shopping text-xl"></i>
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-5 text-center shadow">
                                {cartCount > 99 ? "99+" : cartCount}
                            </span>
                        )}
                    </button>
                    {loggedInUser
                        ? <button
                            type="button"
                            onClick={() => handleNavigate("/customers/me")}
                            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c590]"
                            aria-label="Thông tin tài khoản"
                        >
                            <img
                                src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${loggedInUser?.avatarUrl}`}
                                alt={loggedInUser?.fullName}
                                className="w-10 h-10 border-2 border-[#e4c590] rounded-full object-cover cursor-pointer ring-2 ring-transparent transition-all duration-300 hover:-translate-y-0.5 hover:ring-[#e4c590]"
                            />
                        </button>
                        : <button
                            type="button"
                            className="relative w-12 h-12 text-[#e4c590] border-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e4c590] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c590]"
                            onClick={() => handleNavigate("/auth/login")}
                            aria-label="Đăng nhập"
                        >
                            <i className="fa-solid fa-user"></i>
                        </button>}
                    <button
                        type="button"
                        className="md:hidden w-12 h-12 text-[#e4c590] border-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e4c590] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c590]"
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
                        aria-expanded={isMobileMenuOpen}
                    >
                        <i className={`fa-solid ${isMobileMenuOpen ? "fa-xmark" : "fa-bars"}`}></i>
                    </button>
                </div>

            </div>

            <div className={`md:hidden fixed inset-0 z-60 transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <button
                    type="button"
                    aria-label="Đóng menu"
                    className="absolute inset-0 bg-black/65"
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                <aside
                    className={`absolute right-0 top-0 h-full w-[82%] max-w-sm border-l border-white/10 bg-gray-950 shadow-2xl p-5 transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
                    aria-label="Menu di động"
                >
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-lg font-semibold tracking-wide text-yellow-300">Khám phá CD</p>
                        <button
                            type="button"
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-label="Đóng menu"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <nav aria-label="Điều hướng di động">
                        <ul className="space-y-2">
                            {navItems.map((item, index) => {
                                const isActive = isNavItemActive(item) || activePage === item.key;

                                return (
                                    <li key={item.key}>
                                        <button
                                            type="button"
                                            onClick={() => handleNavigate(item.path)}
                                            style={{ transitionDelay: isMobileMenuOpen ? `${index * 70}ms` : "0ms" }}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c590] ${isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${isActive ? "bg-[#e4c590] text-black font-semibold" : "bg-white/5 hover:bg-white/10 text-white"}`}
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>
            </div>
        </header>
    );
};

export default Header;