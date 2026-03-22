import { useNavigate } from "react-router-dom";

const SideBarMenu = ({ activePage }) => {
    const navigate = useNavigate();

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

    const isStaff = currentRole === "staff";
    const isShipper = currentRole === "shipper";

    const itemClass = "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-slate-300 transition hover:bg-slate-800 hover:text-white";
    const activeClass = "bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30";
    const dotClass = "inline-block h-2 w-2 rounded-full";

    return (
        <aside className="sticky top-0 h-screen w-64 border-r border-slate-800 bg-slate-950 p-4">
            <ul className="space-y-2">
                {isShipper ? (
                    <>
                        <li
                            className={`${itemClass} ${activePage === "orders" ? activeClass : ""}`}
                            onClick={() => navigate("/shipper/deliveries")}>
                            <span className={`${dotClass} bg-emerald-400`} />
                            Đơn hàng giao
                        </li>
                        <li
                            className={`${itemClass} ${activePage === "profile" ? activeClass : ""}`}
                            onClick={() => navigate("/profile")}>
                            <span className={`${dotClass} bg-blue-400`} />
                            Hồ sơ cá nhân
                        </li>
                    </>
                ) : isStaff ? (
                    <>
                        <li
                            className={`${itemClass} ${activePage === "orders" ? activeClass : ""}`}
                            onClick={() => navigate("/admin/orders")}>
                            <span className={`${dotClass} bg-emerald-400`} />
                            Đơn hàng
                        </li>
                        <li
                            className={`${itemClass} ${activePage === "profile" ? activeClass : ""}`}
                            onClick={() => navigate("/profile")}>
                            <span className={`${dotClass} bg-blue-400`} />
                            Hồ sơ cá nhân
                        </li>
                    </>
                ) : (
                    <>
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
                            className={`${itemClass} ${activePage === "wards" ? activeClass : ""}`}
                            onClick={() => navigate("/admin/wards")}>
                            <span className={`${dotClass} bg-teal-400`} />
                            Phường
                        </li>
                        <li
                            className={`${itemClass} ${activePage === "staff" ? activeClass : ""}`}
                            onClick={() => navigate("/admin/users")}>
                            <span className={`${dotClass} bg-rose-400`} />
                            Nhân viên
                        </li>
                        <li
                            className={`${itemClass} ${activePage === "profile" ? activeClass : ""}`}
                            onClick={() => navigate("/profile")}>
                            <span className={`${dotClass} bg-blue-400`} />
                            Hồ sơ cá nhân
                        </li>
                    </>
                )}
            </ul>
        </aside>
    )
}

export default SideBarMenu;