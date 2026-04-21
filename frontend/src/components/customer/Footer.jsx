import { Link } from "react-router-dom";
import { RESTAURANT_INFO } from "../../constants/restaurantInfo";

const Footer = () => {
    const quickLinks = [
        { label: "Trang chủ", to: "/" },
        { label: "Thực đơn", to: "/menus" },
        { label: "Khuyến mãi", to: "/promotions" },
        { label: "Về chúng tôi", to: "/about" },
        { label: "Liên hệ", to: "/contact" }
    ];

    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-20 overflow-hidden border-t border-[#e4c590]/20 bg-gray-950 text-gray-300">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(228,197,144,0.16),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(228,197,144,0.1),transparent_40%)]" />

            <div className="relative mx-auto grid w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4 lg:px-0">
                <div className="lg:col-span-2">
                    <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-[#e4c590]/35 bg-black/35 px-4 py-2">
                        <img src="/logo.png" alt="Logo Ca Dao" className="h-9 w-9 rounded-full object-cover" />
                        <p className="text-base font-bold tracking-[0.2em] text-[#e4c590]">CA DAO</p>
                    </div>

                    <h3 className="max-w-xl text-2xl font-semibold leading-snug text-white">
                        Không gian ẩm thực Việt đậm bản sắc, phục vụ tận tâm trong từng bữa ăn.
                    </h3>

                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-400">
                        Chúng tôi chọn nguyên liệu tươi mỗi ngày, chế biến chỉn chu và giao món nhanh chóng để mỗi trải nghiệm tại Ca Dao luôn trọn vẹn.
                    </p>

                    <div className="mt-6 flex items-center gap-3">
                        <a
                            href={`tel:${RESTAURANT_INFO.phone.replace(/\s+/g, "")}`}
                            className="rounded-full border border-[#e4c590]/40 px-4 py-2 text-sm font-semibold text-[#e4c590] transition-all duration-300 hover:bg-[#e4c590] hover:text-black"
                        >
                            Gọi ngay: {RESTAURANT_INFO.phone}
                        </a>
                    </div>
                </div>

                <div>
                    <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#e4c590]">Điều hướng</p>
                    <ul className="space-y-3">
                        {quickLinks.map((link) => (
                            <li key={link.to}>
                                <Link
                                    to={link.to}
                                    className="inline-flex items-center gap-2 text-sm text-gray-300 transition-colors duration-300 hover:text-[#e4c590]"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#e4c590]/70" />
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#e4c590]">Liên hệ</p>
                    <div className="space-y-3 text-sm">
                        <p className="leading-relaxed text-gray-300">{RESTAURANT_INFO.address}</p>
                        <a href={`tel:${RESTAURANT_INFO.phone.replace(/\s+/g, "")}`} className="block text-gray-300 transition-colors hover:text-[#e4c590]">
                            {RESTAURANT_INFO.phone}
                        </a>
                        <a href="mailto:cd@gmail.com" className="block text-gray-300 transition-colors hover:text-[#e4c590]">
                            cd@gmail.com
                        </a>
                    </div>

                    <div className="mt-5 flex gap-3">
                        <a href="https://www.facebook.com/CADAORestaurantCoffee" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-gray-300 transition hover:border-[#e4c590] hover:text-[#e4c590]">
                            <i className="fa-brands fa-facebook-f" />
                        </a>
                        <a href="https://www.instagram.com/ca.dao_restaurant.cafe/" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-gray-300 transition hover:border-[#e4c590] hover:text-[#e4c590]">
                            <i className="fa-brands fa-instagram" />
                        </a>
                        <a href="https://www.tiktok.com/@bunhuyenmecadao" aria-label="TikTok" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-gray-300 transition hover:border-[#e4c590] hover:text-[#e4c590]">
                            <i className="fa-brands fa-tiktok" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;