import { useNavigate } from "react-router-dom";

const SideBarMenu = ({ activePage }) => {
    const navigate = useNavigate();

    const itemClass = "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-slate-300 transition hover:bg-slate-800 hover:text-white";
    const activeClass = "bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30";
    const dotClass = "inline-block h-2 w-2 rounded-full";

    return (
        <aside className="sticky top-0 h-screen w-64 border-r border-slate-800 bg-slate-950 p-4">
            <ul className="space-y-2">
                <li
                    className={`${itemClass} ${activePage === "dashboard" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/dashboard")}>
                    <span className={`${dotClass} bg-cyan-400`} />
                    Tổng quan
                </li>
                <li
                    className={`${itemClass} ${activePage === "orders" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/orders")}>
                    <span className={`${dotClass} bg-emerald-400`} />
                    Đơn hàng
                </li>
                <li
                    className={`${itemClass} ${activePage === "menu" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/menus")}>
                    <span className={`${dotClass} bg-amber-400`} />
                    Thực đơn
                </li>
                <li
                    className={`${itemClass} ${activePage === "customers" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/customers")}>
                    <span className={`${dotClass} bg-violet-400`} />
                    Khách hàng
                </li>
                <li
                    className={`${itemClass} ${activePage === "staff" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/users")}>
                    <span className={`${dotClass} bg-rose-400`} />
                    Nhân viên
                </li>
            </ul>
        </aside>
    )
}

export default SideBarMenu;