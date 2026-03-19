import { useNavigate } from "react-router-dom";

const SideBarMenu = ({ activePage }) => {
    const navigate = useNavigate();

    const activeClass = "text-blue-500 font-bold";

    return (
        <div className="sticky top-0 w-64 h-screen bg-gray-100 p-4">
            <ul className="space-y-2">
                <li
                    className={`px-3 py-2 cursor-pointer ${activePage === "dashboard" ? activeClass : ""}`}
                    onClick={() => navigate("/admin")}>
                    Tổng quang
                </li>
                <li
                    className={`px-3 py-2 cursor-pointer ${activePage === "orders" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/orders")}>
                    Đơn hàng
                </li>
                <li
                    className={`px-3 py-2 cursor-pointer ${activePage === "menu" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/menu")}>
                    Thực đơn
                </li>
                <li
                    className={`px-3 py-2 cursor-pointer ${activePage === "customers" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/customers")}>
                    Khách hàng
                </li>
                <li
                    className={`px-3 py-2 cursor-pointer ${activePage === "staff" ? activeClass : ""}`}
                    onClick={() => navigate("/admin/staff")}>
                    Nhân viên
                </li>
            </ul>
        </div>
    )
}

export default SideBarMenu;