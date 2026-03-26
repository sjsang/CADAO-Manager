import Header from "../../components/customer/Header";
import AddressManager from "../../components/customer/AddressManager";
import CustomerConfirmModal from "../../components/customer/CustomerConfirmModal";
import authApi from "../../api/authApi";
import orderApi from "../../api/orderApi";
import customerApi from "../../api/customerApi";
import { getStatusText } from "../../functions/formatOrderFields";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import { notifyCustomer } from "../../utils/customerNotify";

const buildCloudinaryUrl = (publicId) => {
    if (!publicId) {
        return "";
    }

    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${publicId}`;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(0|\+84)\d{9,10}$/;
const CUSTOMER_ORDER_PAGE_SIZE = 6;

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [editForm, setEditForm] = useState({
        full_name: "",
        email: "",
        phone_number: ""
    });
    const [isEditing, setIsEditing] = useState(false);
    const [orders, setOrders] = useState([]);
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("all");
    const [orderPage, setOrderPage] = useState(1);
    const [orderPagination, setOrderPagination] = useState({
        page: 1,
        limit: CUSTOMER_ORDER_PAGE_SIZE,
        totalItems: 0,
        totalPages: 1
    });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authApi.me();
                const profileData = response.data;
                setProfile(profileData);
                setEditForm({
                    full_name: profileData?.full_name || "",
                    email: profileData?.email || "",
                    phone_number: profileData?.phone_number || ""
                });
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
        };

        fetchProfile();
    }, []);



    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await orderApi.getByCustomerId({
                    search: orderSearch,
                    status: orderStatusFilter,
                    page: orderPage,
                    limit: CUSTOMER_ORDER_PAGE_SIZE
                });
                const ordersData = response.data?.data || [];
                const mappedOrders = ordersData.map((order) => ({
                    ...order,
                    rawStatus: order.status,
                    status: getStatusText(order.status)
                }));
                setOrders(mappedOrders);
                setOrderPagination(response.data?.pagination || {
                    page: orderPage,
                    limit: CUSTOMER_ORDER_PAGE_SIZE,
                    totalItems: mappedOrders.length,
                    totalPages: 1
                });
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            }
        };

        fetchOrders();
    }, [orderSearch, orderStatusFilter, orderPage]);

    useEffect(() => {
        setOrderPage(1);
    }, [orderSearch, orderStatusFilter]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await authApi.logout();
            sessionStorage.removeItem("token");
            navigate("/auth/login");
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                sessionStorage.removeItem("token");
                navigate("/auth/login");
                return;
            }

            console.error("Failed to logout:", error);
            notifyCustomer({ message: "Không thể đăng xuất ngay lúc này. Vui lòng thử lại.", type: "error" });
        } finally {
            setIsLoggingOut(false);
            setIsLogoutConfirmOpen(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditClick = () => {
        setEditForm({
            full_name: profile?.full_name || "",
            email: profile?.email || "",
            phone_number: profile?.phone_number || ""
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditForm({
            full_name: profile?.full_name || "",
            email: profile?.email || "",
            phone_number: profile?.phone_number || ""
        });
        setIsEditing(false);
    };

    const handleSaveClick = async () => {
        const fullName = (editForm?.full_name || "").trim();
        const email = (editForm?.email || "").trim();
        const phone = (editForm?.phone_number || "").trim();

        if (!fullName) {
            notifyCustomer({ message: "Họ tên không được để trống.", type: "warning" });
            return;
        }

        if (!emailRegex.test(email)) {
            notifyCustomer({ message: "Email không hợp lệ.", type: "warning" });
            return;
        }

        if (!phoneRegex.test(phone)) {
            notifyCustomer({ message: "Số điện thoại không hợp lệ.", type: "warning" });
            return;
        }

        try {
            await customerApi.update({ name: fullName, email, phone });
            setProfile((prev) => ({
                ...prev,
                full_name: fullName,
                email,
                phone_number: phone
            }));
            setEditForm({
                full_name: fullName,
                email,
                phone_number: phone
            });
            setIsEditing(false);
            notifyCustomer({ message: "Cập nhật thông tin thành công.", type: "success" });
        } catch (error) {
            console.error("Failed to update profile:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Không thể cập nhật thông tin cá nhân.",
                type: "error"
            });
        }
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setUploadingAvatar(true);

        try {
            const response = await customerApi.updateAvatar(file);
            const updated = response.data?.data;

            if (updated?.avatar_url) {
                setProfile((prev) => ({
                    ...prev,
                    avatar_url: updated.avatar_url
                }));
            }
        } catch (error) {
            console.error("Failed to update avatar:", error);
            notifyCustomer({
                message: error.response?.data?.message || "Không thể cập nhật ảnh đại diện.",
                type: "error"
            });
        } finally {
            setUploadingAvatar(false);
            event.target.value = "";
        }
    };

    return (
        <>
            <div>
                <Header />

                <div className="w-7xl mx-auto py-10 text-white">
                    <div data-aos="fade-up" className="text-center mb-12">
                        <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Thông tin cá nhân, địa chỉ, đơn hàng</p>
                        <h1 className="text-5xl font-bold mb-5">Hồ sơ</h1>
                        <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                    </div>
                    {profile && (
                        <div data-aos="fade-up" className="mb-12">
                            <div className="bg-black/30 border border-white/10 rounded-2xl p-10">
                                <div className="grid lg:grid-cols-3 gap-10">
                                    <div className="flex flex-col items-center justify-center gap-6">
                                        <div className="h-40 w-40 overflow-hidden rounded-full border-2 border-[#e4c590]/40 bg-black/60">
                                            {profile.avatar_url ? (
                                                <img
                                                    src={buildCloudinaryUrl(profile.avatar_url)}
                                                    alt="Avatar khách hàng"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <label className="group cursor-pointer relative overflow-hidden px-8 py-2.5 border border-[#e4c590]/60 text-[#e4c590] rounded-lg">
                                            <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                            <span className="relative z-10 text-sm font-semibold group-hover:text-black transition-colors">
                                                {uploadingAvatar ? "Đang tải..." : "Thay ảnh"}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                disabled={uploadingAvatar}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="space-y-5">
                                            <label className="flex flex-col gap-1.5">
                                                <span className="text-xs tracking-widest text-gray-400 uppercase">Tên khách hàng</span>
                                                {isEditing ? (
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                        <input
                                                            type="text"
                                                            name="full_name"
                                                            value={editForm.full_name}
                                                            onChange={handleChange}
                                                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-lg text-white">{profile.full_name}</p>
                                                )}
                                            </label>

                                            <label className="flex flex-col gap-1.5">
                                                <span className="text-xs tracking-widest text-gray-400 uppercase">Email</span>
                                                {isEditing ? (
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                                        </svg>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={editForm.email}
                                                            onChange={handleChange}
                                                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-lg text-white">{profile.email}</p>
                                                )}
                                            </label>

                                            <label className="flex flex-col gap-1.5">
                                                <span className="text-xs tracking-widest text-gray-400 uppercase">Số điện thoại</span>
                                                {isEditing ? (
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
                                                        </svg>
                                                        <input
                                                            type="text"
                                                            name="phone_number"
                                                            value={editForm.phone_number}
                                                            onChange={handleChange}
                                                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-lg text-white">{profile.phone_number}</p>
                                                )}
                                            </label>
                                        </div>

                                        <div className="flex gap-4 mt-8">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveClick}
                                                        className="group relative overflow-hidden px-6 py-2.5 border border-green-500/60 text-green-400 rounded-lg cursor-pointer"
                                                    >
                                                        <span className="absolute inset-0 bg-green-500 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                                        <span className="relative z-10 text-sm font-semibold group-hover:text-black transition-colors">LƯU</span>
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-6 py-2.5 border border-gray-500/40 text-gray-400 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-sm font-semibold"
                                                    >
                                                        HỦY
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={handleEditClick}
                                                        className="group relative overflow-hidden px-6 py-2.5 border border-[#e4c590]/60 text-[#e4c590] rounded-lg cursor-pointer"
                                                    >
                                                        <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                                        <span className="relative z-10 text-sm font-semibold group-hover:text-black transition-colors">CẬP NHẬT THÔNG TIN</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setIsLogoutConfirmOpen(true)}
                                                        className="group relative overflow-hidden px-6 py-2.5 border border-red-500/40 text-red-400 rounded-lg cursor-pointer"
                                                    >
                                                        <span className="absolute inset-0 bg-red-500 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                                        <span className="relative z-10 text-sm font-semibold group-hover:text-black transition-colors">ĐĂNG XUẤT</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div data-aos="fade-up" data-aos-delay="100">
                        <AddressManager />
                    </div>

                    <div data-aos="fade-up" data-aos-delay="200" className="mt-16">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#e4c590]">Đơn hàng của bạn</h2>

                            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 w-full md:w-auto md:min-w-130">
                                <input
                                    type="text"
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    placeholder="Tìm theo mã đơn, người nhận, số điện thoại..."
                                    className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e4c590]"
                                />
                                <select
                                    value={orderStatusFilter}
                                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#e4c590]"
                                >
                                    <option value="all" className="text-black">Tất cả trạng thái</option>
                                    <option value="pending" className="text-black">Chờ xác nhận</option>
                                    <option value="confirmed" className="text-black">Đã xác nhận</option>
                                    <option value="preparing" className="text-black">Đang chuẩn bị</option>
                                    <option value="shipping" className="text-black">Đang giao hàng</option>
                                    <option value="completed" className="text-black">Đã hoàn thành</option>
                                    <option value="cancelled" className="text-black">Đã hủy</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-black/60 border-b border-white/10">
                                            <th className="p-4 text-sm font-semibold text-[#e4c590] uppercase tracking-wider">Mã đơn</th>
                                            <th className="p-4 text-sm font-semibold text-[#e4c590] uppercase tracking-wider">Người nhận</th>
                                            <th className="p-4 text-sm font-semibold text-[#e4c590] uppercase tracking-wider">Điện thoại</th>
                                            <th className="p-4 text-sm font-semibold text-[#e4c590] uppercase tracking-wider">Địa chỉ</th>
                                            <th className="p-4 text-sm font-semibold text-[#e4c590] uppercase tracking-wider">Tổng tiền</th>
                                            <th className="p-4 text-sm font-semibold text-[#e4c590] uppercase tracking-wider">Trạng thái</th>
                                            <th className="p-4 text-sm font-semibold text-[#e4c590] uppercase tracking-wider">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orders.map((order) => (
                                            <tr key={order.order_code} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-sm text-white font-mono">{order.order_code}</td>
                                                <td className="p-4 text-sm text-gray-300">{order.delivery_full_name}</td>
                                                <td className="p-4 text-sm text-gray-400">{order.delivery_phone}</td>
                                                <td className="p-4 text-sm text-gray-400 max-w-xs truncate">{order.delivery_address}</td>
                                                <td className="p-4 text-sm font-semibold text-[#e4c590]">{Number(order.total_amount).toLocaleString('vi-VN')}đ</td>
                                                <td className="p-4 text-sm">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.rawStatus === "completed" ? "bg-green-500/20 text-green-400" :
                                                        order.rawStatus === "cancelled" ? "bg-red-500/20 text-red-400" :
                                                            order.rawStatus === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                                                "bg-blue-500/20 text-blue-400"
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm">
                                                    <button
                                                        className="px-3 py-1.5 bg-black/40 border border-[#e4c590]/30 text-[#e4c590] rounded-lg hover:bg-black/60 transition-colors text-xs font-semibold"
                                                        onClick={() => navigate(`/orders/${order.order_code}`)}
                                                    >
                                                        Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="p-6 text-sm text-center text-gray-400">Không có đơn hàng phù hợp bộ lọc.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {orderPagination.totalItems > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                                    <p className="text-sm text-gray-400">
                                        Tổng đơn: <span className="text-white font-semibold">{orderPagination.totalItems}</span>
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={orderPagination.page <= 1}
                                            onClick={() => setOrderPage((prev) => Math.max(1, prev - 1))}
                                            className="px-3 py-1.5 text-sm border border-white/20 rounded-lg text-gray-200 hover:border-[#e4c590]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Trước
                                        </button>
                                        <span className="text-sm text-gray-300">
                                            Trang {orderPagination.page}/{Math.max(1, orderPagination.totalPages)}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={orderPagination.page >= orderPagination.totalPages}
                                            onClick={() => setOrderPage((prev) => Math.min(orderPagination.totalPages, prev + 1))}
                                            className="px-3 py-1.5 text-sm border border-white/20 rounded-lg text-gray-200 hover:border-[#e4c590]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CustomerConfirmModal
                isOpen={isLogoutConfirmOpen}
                title="Xác nhận đăng xuất"
                description="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?"
                confirmText="Đăng xuất"
                cancelText="Ở lại"
                tone="warning"
                busy={isLoggingOut}
                onConfirm={handleLogout}
                onClose={() => setIsLogoutConfirmOpen(false)}
            />
        </>
    )
}

export default ProfilePage;