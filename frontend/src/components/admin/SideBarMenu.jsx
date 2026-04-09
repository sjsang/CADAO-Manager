import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const SideBarMenu = ({ activePage }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const token = sessionStorage.getItem("token");
    let currentRole = "admin";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            currentRole = payload?.role || "admin";
        } catch {
            currentRole = "admin";
        }
    }

    useEffect(() => {
        const stored = window.localStorage.getItem("cadao-admin-sidebar-collapsed");
        if (stored === "1") {
            setIsCollapsed(true);
        }
    }, []);

    const isShipper = currentRole === "shipper";

    if (isShipper) {
        return null;
    }

    const menuItems = useMemo(() => ([
        { key: "dashboard", label: "Tổng quan", path: "/admin/dashboard", icon: "fa-solid fa-chart-pie text-sky-500" },
        { key: "orders", label: "Đơn hàng", path: "/admin/orders", icon: "fa-solid fa-receipt text-emerald-500" },
        { key: "chat", label: "Hội thoại", path: "/admin/chats", icon: "fa-solid fa-comments text-indigo-500" },
        { key: "reviews", label: "Đánh giá", path: "/admin/reviews", icon: "fa-solid fa-star text-amber-500" },
        { key: "feedbacks", label: "Góp ý", path: "/admin/feedbacks", icon: "fa-solid fa-envelope text-lime-500" },

        { key: "menu", label: "Thực đơn", path: "/admin/menus", icon: "fa-solid fa-utensils text-orange-500" },
        { key: "promotions", label: "Khuyến mãi", path: "/admin/promotions", icon: "fa-solid fa-gift text-pink-500" },
        { key: "vouchers", label: "Voucher", path: "/admin/vouchers", icon: "fa-solid fa-ticket text-rose-500" },

        { key: "customers", label: "Khách hàng", path: "/admin/customers", icon: "fa-solid fa-users text-violet-500" },
        { key: "statistics", label: "Thống kê", path: "/admin/statistics", icon: "fa-solid fa-chart-line text-blue-500" },

        { key: "wards", label: "Phường", path: "/admin/wards", icon: "fa-solid fa-map text-teal-500" },
        { key: "users", label: "Nhân sự", path: "/admin/users", icon: "fa-solid fa-user text-red-500" }
    ]), []);

    const toggleSidebar = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        window.localStorage.setItem("cadao-admin-sidebar-collapsed", next ? "1" : "0");
    };

    const itemClass = "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-800 hover:bg-slate-900 hover:text-white";
    const activeClass = "border-sky-500/40 bg-sky-500/10 text-sky-300";
    const iconClass = "text-lg";

    return (
        <aside
            className={`sticky top-0 h-screen border-r border-slate-800 bg-slate-950 px-3 py-4 transition-all duration-300 ${isCollapsed ? "w-20" : "w-68"}`}
            aria-label="Admin navigation"
        >
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-2 rounded-md text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950 transition"
                    title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                >
                    <i className="fa-solid fa-bars"></i>
                </button>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.key}>
                            <button
                                type="button"
                                className={`${itemClass} ${activePage === item.key ? activeClass : ""} w-full ${isCollapsed ? "justify-center" : "justify-start"}`}
                                onClick={() => navigate(item.path)}
                                title={item.label}
                            >
                                <i className={`${item.icon} ${iconClass}`} />
                                {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    )
}

export default SideBarMenu;