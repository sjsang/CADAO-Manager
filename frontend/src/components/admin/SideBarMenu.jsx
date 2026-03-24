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
        { key: "dashboard", label: "Tổng quan", path: "/admin/dashboard", dot: "bg-cyan-400" },
        { key: "statistics", label: "Thống kê", path: "/admin/statistics", dot: "bg-lime-400" },
        { key: "orders", label: "Đơn hàng", path: "/admin/orders", dot: "bg-emerald-400" },
        { key: "menu", label: "Thực đơn", path: "/admin/menus", dot: "bg-amber-400" },
        { key: "menu-categories", label: "Danh mục món", path: "/admin/menu-categories", dot: "bg-indigo-400" },
        { key: "customers", label: "Khách hàng", path: "/admin/customers", dot: "bg-violet-400" },
        { key: "wards", label: "Phường", path: "/admin/wards", dot: "bg-teal-400" },
        { key: "vouchers", label: "Voucher", path: "/admin/vouchers", dot: "bg-orange-400" },
        { key: "reviews", label: "Đánh giá", path: "/admin/reviews", dot: "bg-yellow-400" },
        { key: "users", label: "Tài khoản", path: "/admin/users", dot: "bg-rose-400" }
    ]), []);

    const toggleSidebar = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        window.localStorage.setItem("cadao-admin-sidebar-collapsed", next ? "1" : "0");
    };

    const itemClass = "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-800 hover:bg-slate-900 hover:text-white";
    const activeClass = "border-sky-500/40 bg-sky-500/10 text-sky-300";
    const dotClass = "inline-block h-2.5 w-2.5 rounded-full";

    return (
        <aside
            className={`sticky top-0 h-screen border-r border-slate-800 bg-slate-950 px-3 py-4 transition-all duration-300 ${isCollapsed ? "w-20" : "w-68"}`}
            aria-label="Admin navigation"
        >
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="inline-flex h-10 w-full items-center justify-center text-xl rounded-lg border border-slate-800 text-slate-300 transition hover:bg-slate-900 hover:text-white"
                    title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                >
                    {isCollapsed ? "»" : "«"}
                </button>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4">
                <ul className="space-y-1.5">
                    {menuItems.map((item) => (
                        <li key={item.key}>
                            <button
                                type="button"
                                className={`${itemClass} ${activePage === item.key ? activeClass : ""} w-full ${isCollapsed ? "justify-center" : "justify-start"}`}
                                onClick={() => navigate(item.path)}
                                title={item.label}
                            >
                                <span className={`${dotClass} ${item.dot}`} />
                                {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="absolute bottom-4 left-3 right-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                    {!isCollapsed ? "Chế độ quản trị" : "Admin"}
                </div>
            </div>
        </aside>
    )
}

export default SideBarMenu;