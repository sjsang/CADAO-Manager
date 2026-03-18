import Header from "../../components/customer/Header";
import authApi from "../../api/authApi";
import orderApi from "../../api/orderApi";
import { getStatusText } from "../../functions/formatOrderFields";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [orders, setOrders] = useState([]);

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
            navigate("/login");
        } catch (error) {
            console.error("Failed to logout:", error);
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
        // try {
        //     await customerApi.update(profile);
        //     setIsEditing(false);
        //     alert("Cập nhật thông tin thành công!");
        // } catch (error) {
        //     console.error("Failed to update profile:", error);
        //     alert("Cập nhật thông tin thất bại!");
        // }
        setIsEditing(false);
    };

    return (
        <div>
            <Header />

            <div className="w-7xl mx-auto mt-12 text-white">
                {profile && (
                    <div className="flex gap-12 p-4 bg-gray-800 rounded-lg">
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