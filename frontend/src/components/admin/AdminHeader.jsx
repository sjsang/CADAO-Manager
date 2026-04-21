import { useNavigate } from "react-router-dom";
import { useState } from "react";
import authApi from "../../api/authApi";
import { formatDateDDMMYYYY } from "../../functions/formatDate";
import ConfirmModal from "./modals/ConfirmModal";
import NoticeModal from "./modals/NoticeModal";

const AdminHeader = ({ title, subtitle }) => {
    const navigate = useNavigate();
    const today = formatDateDDMMYYYY(new Date());
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [noticeMessage, setNoticeMessage] = useState("");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    const shouldShowWorklistButton = currentRole === "shipper";

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await authApi.logout();
            sessionStorage.removeItem("token");
            window.dispatchEvent(new Event("authChanged"));
            navigate("/admin/login", { replace: true });
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                sessionStorage.removeItem("token");
                window.dispatchEvent(new Event("authChanged"));
                navigate("/admin/login", { replace: true });
                return;
            }

            console.error("Failed to logout admin:", error);
            setNoticeMessage("Không thể đăng xuất ngay lúc này. Vui lòng thử lại.");
        } finally {
            setIsLoggingOut(false);
            setIsLogoutConfirmOpen(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100/85 px-6 py-2.5 backdrop-blur-md">
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold tracking-wide">CA DAO ADMIN</span>
                            <span>{today}</span>
                        </div>
                        <h1 className="mt-1 truncate text-xl font-semibold text-slate-800">{title}</h1>
                        {subtitle ? <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p> : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="hidden rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 sm:inline-flex">
                            {adminLabel}
                        </span>
                        <button
                            onClick={() => navigate("/profile")}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            Hồ sơ
                        </button>
                        {shouldShowWorklistButton ? (
                            <button
                                onClick={() => navigate(worklistRoute)}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                                Công việc
                            </button>
                        ) : null}
                        <button
                            onClick={() => navigate("/")}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            Trang chủ
                        </button>
                        <button
                            onClick={() => setIsLogoutConfirmOpen(true)}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>

                <NoticeModal
                    isOpen={Boolean(noticeMessage)}
                    title="Không thể hoàn tất thao tác"
                    description={noticeMessage}
                    tone="warning"
                    onClose={() => setNoticeMessage("")}
                />
            </header>

            <ConfirmModal
                isOpen={isLogoutConfirmOpen}
                title="Xác nhận đăng xuất"
                description="Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?"
                confirmText="Đăng xuất"
                cancelText="Ở lại"
                tone="warning"
                busy={isLoggingOut}
                onClose={() => setIsLogoutConfirmOpen(false)}
                onConfirm={handleLogout}
            />
        </>
    );
};

export default AdminHeader;
