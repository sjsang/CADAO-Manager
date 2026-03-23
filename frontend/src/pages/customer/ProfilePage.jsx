import Header from "../../components/customer/Header";
import AddressManager from "../../components/customer/AddressManager";
import authApi from "../../api/authApi";
import orderApi from "../../api/orderApi";
import customerApi from "../../api/customerApi";
import { getStatusText } from "../../functions/formatOrderFields";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const buildCloudinaryUrl = (publicId) => {
    if (!publicId) {
        return "";
    }

    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${publicId}`;
};

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [orders, setOrders] = useState([]);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authApi.me();
                setProfile(response.data);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
        };

        fetchProfile();
    }, []);



    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await orderApi.getByCustomerId();
                const ordersData = response.data.data;
                const mappedOrders = ordersData.map((order) => ({
                    ...order,
                    rawStatus: order.status,
                    status: getStatusText(order.status)
                }));
                setOrders(mappedOrders);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            }
        };

        fetchOrders();
    }, []);

    const handleLogout = async () => {
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
            alert("Không thể đăng xuất ngay lúc này. Vui lòng thử lại.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = async () => {
        try {
            const { full_name, email, phone_number } = profile;
            await customerApi.update({ name: full_name, email, phone: phone_number });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
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
            alert(error.response?.data?.message || "Không thể cập nhật ảnh đại diện.");
        } finally {
            setUploadingAvatar(false);
            event.target.value = "";
        }
    };

    return (
        <div>
            <Header />

            <div className="w-7xl mx-auto mt-12 text-white">
                {profile && (
                    <div className="flex gap-12 p-4 bg-gray-800 rounded-lg">
                        <div className="w-42 flex shrink-0 flex-col items-center gap-3">
                            <div className="h-28 w-28 overflow-hidden rounded-full border border-gray-600 bg-gray-700">
                                {profile.avatar_url ? (
                                    <img
                                        src={buildCloudinaryUrl(profile.avatar_url)}
                                        alt="Avatar khách hàng"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">Chưa có ảnh</div>
                                )}
                            </div>

                            <label className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
                                {uploadingAvatar ? "Đang tải..." : "Đổi ảnh"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    disabled={uploadingAvatar}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div>
                            <p className="text-gray-400 mb-1">Tên khách hàng</p>
                            {isEditing
                                ? <input
                                    type="text"
                                    name="full_name"
                                    value={profile.full_name}
                                    onChange={handleChange}
                                    className="p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                : <p className="text-lg">{profile.full_name}</p>}
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">Email</p>
                            {isEditing
                                ? <input
                                    type="text"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    className="p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                : <p className="text-lg">{profile.email}</p>}
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">Số điện thoại</p>
                            {isEditing
                                ? <input
                                    type="text"
                                    name="phone_number"
                                    value={profile.phone_number}
                                    onChange={handleChange}
                                    className="p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                : <p className="text-lg">{profile.phone_number}</p>}
                        </div>
                        <div className="flex items-center gap-6 ml-auto">
                            {isEditing
                                ? <button className="cursor-pointer hover:underline text-green-500"
                                    onClick={handleSaveClick}
                                >
                                    Lưu
                                </button>
                                : <button className="cursor-pointer hover:underline text-blue-500"
                                    onClick={handleEditClick}
                                >
                                    Cập nhật thông tin
                                </button>}
                            <button className="ml-auto cursor-pointer hover:underline text-orange-500"
                                onClick={handleLogout}
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                )}

                {/* Address Manager */}
                <AddressManager />

                {orders.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4">Đơn hàng của bạn</h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-700">
                                    <th className="p-3 border border-gray-600">Mã đơn hàng</th>
                                    <th className="p-3 border border-gray-600">Tên người nhận</th>
                                    <th className="p-3 border border-gray-600">Số điện thoại</th>
                                    <th className="p-3 border border-gray-600">Địa chỉ</th>
                                    <th className="p-3 border border-gray-600">Tổng tiền</th>
                                    <th className="p-3 border border-gray-600">Trạng thái</th>
                                    <th className="p-3 border border-gray-600">Đánh giá</th>
                                    <th className="p-3 border border-gray-600">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.order_code} className="border-t border-gray-600">
                                        <td className="p-3 border border-gray-600">{order.order_code}</td>
                                        <td className="p-3 border border-gray-600">{order.delivery_full_name}</td>
                                        <td className="p-3 border border-gray-600">{order.delivery_phone}</td>
                                        <td className="p-3 border border-gray-600">{order.delivery_address}</td>
                                        <td className="p-3 border border-gray-600">{Number(order.total_amount).toLocaleString('vi-VN')}đ</td>
                                        <td className="p-3 border border-gray-600">{order.status}</td>
                                        <td className="p-3 border border-gray-600">
                                            {order.rawStatus === "completed" ? (
                                                order.has_review ? (
                                                    <span className="text-yellow-400 text-sm">★ Đã đánh giá</span>
                                                ) : (
                                                    <button
                                                        className="text-yellow-500 cursor-pointer hover:underline text-sm"
                                                        onClick={() => navigate(`/orders/${order.order_code}`)}
                                                    >
                                                        Đánh giá ngay
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-gray-500 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="p-3 border border-gray-600">
                                            <button
                                                className="text-blue-500 cursor-pointer hover:underline"
                                                onClick={() => navigate(`/orders/${order.order_code}`)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProfilePage;