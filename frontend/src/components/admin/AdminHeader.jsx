import { useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import { formatDateDDMMYYYY } from "../../functions/formatDate";

const AdminHeader = ({ title, subtitle }) => {
    const navigate = useNavigate();
    const today = formatDateDDMMYYYY(new Date());

    const token = sessionStorage.getItem("token");
    let adminLabel = "Quản trị viên";
    let currentRole = "admin";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            adminLabel = `#${payload?.username}`;
            currentRole = payload?.role || "admin";

        } catch {
            adminLabel = "Quản trị viên";
            currentRole = "admin";
        }
    }

    const worklistRoute = currentRole === "shipper" ? "/shipper/deliveries" : "/admin/orders";
    const shouldShowWorklistButton = currentRole === "staff" || currentRole === "shipper";

    const handleLogout = async () => {
        try {
            await authApi.logout();
            sessionStorage.removeItem("token");
            navigate("/admin/login", { replace: true });
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                sessionStorage.removeItem("token");
                navigate("/admin/login", { replace: true });
                return;
            }

            console.error("Failed to logout admin:", error);
            alert("Không thể đăng xuất ngay lúc này. Vui lòng thử lại.");
        }
    };

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100/80 px-6 py-4 backdrop-blur">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-blue-500 uppercase">CADAO Admin</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-800">{title}</h1>
                        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
                        <p className="mt-2 text-xs text-slate-400">{today}</p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 md:inline-block">
                            {adminLabel}
                        </span>
                        <button
                            onClick={() => navigate("/profile")}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            Hồ sơ cá nhân
                        </button>
                        {shouldShowWorklistButton ? (
                            <button
                                onClick={() => navigate(worklistRoute)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                                Danh sách đơn
                            </button>
                        ) : null}
                        <button
                            onClick={() => navigate("/")}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            Về trang chủ
                        </button>
                        <button
                            onClick={handleLogout}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
