import SideBarMenu from "../../components/admin/SideBarMenu";
import orderApi from "../../api/orderApi";
import { useEffect, useState } from "react";

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await orderApi.getAllOrders(search);
                if (response.data.success) {
                    setOrders(response.data.data);
                } else {
                    console.error("Failed to fetch orders:", response.data.message);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };

        fetchOrders();
    }, [search]);

    return (
        <div className="flex">

            <SideBarMenu activePage="orders" />

            <div className="flex-1">
                <div className="bg-gray-100 min-h-full p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="flex-1 text-2xl font-bold text-gray-700 mb-4">Quản lý đơn hàng</h2>

                        <div className="flex-1 flex gap-3 mb-6">
                            <input
                                type="text"
                                placeholder="Tìm đơn hàng..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 p-3 rounded-lg bg-white focus:outline-none"
                            />
                        </div>
                    </div>
                    {orders.map((order) => (
                        <div key={order.id} className="flex items-center gap-4 p-4 bg-white rounded-lg mb-3">
                            <div className="w-50">
                                <p className="text-gray-500">Mã đơn hàng:</p>
                                <h2 className="text-lg">{order.order_code}</h2>
                            </div>
                            <div className="w-100 ml-auto">
                                <p className="text-gray-500">Tên khách hàng:</p>
                                <p className="text-lg">{order.delivery_full_name}</p>
                            </div>
                            <div className="w-35 ml-auto">
                                <p className="text-gray-500">Tổng tiền:</p>
                                <p className="text-lg">{Number(order.total_amount).toLocaleString('vi-VN')}đ</p>
                            </div>
                            <div className="w-35 ml-auto">
                                <p className="text-gray-500">Trạng thái:</p>
                                <p className="text-lg">{order.status}</p>
                            </div>
                            <div className="ml-auto">
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default OrderManager;