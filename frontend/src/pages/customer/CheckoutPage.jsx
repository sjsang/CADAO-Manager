import Header from "../../components/customer/Header";
import orderApi from "../../api/orderApi";
import cartApi from "../../api/cartApi";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const CheckoutPage = () => {
    const { orderCode } = useParams();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);
    const [form, setForm] = useState({
        delivery_full_name: "",
        delivery_phone: "",
        delivery_address: "",
        delivery_ward_name: "",
        notes: "",
        paymentMethod: "cash"
    });

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await orderApi.getByOrderCode(orderCode);
                setOrderDetails(response.data.data);
                setForm({
                    delivery_full_name: response.data.data.delivery_full_name,
                    delivery_phone: response.data.data.delivery_phone,
                    delivery_address: response.data.data.delivery_address || "",
                    delivery_ward_name: response.data.data.delivery_ward_name || "",
                    notes: response.data.data.notes || "",
                    paymentMethod: "cash"
                });
            } catch (error) {
                console.error("Failed to fetch order details:", error);
            }
        };
        fetchOrderDetails();
    }, [orderCode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                subtotal: orderDetails.subtotal,
                shipping_fee: orderDetails.shipping_fee,
                discount_amount: orderDetails.discount_amount,
                total_amount: orderDetails.total_amount
            };
            const result = await orderApi.confirm(orderCode, payload, form.paymentMethod);
            alert(`Đơn hàng xác nhận thành công! Mã đơn hàng: ${orderCode}`);
            await cartApi.deleteAllCartItems();
            navigate("/");
        } catch (error) {
            console.error("Failed to confirm order:", error);
            alert("Xác nhận đơn hàng thất bại!");
        }
    };

    return (
        <div>
            <Header />

            <div className="w-7xl mx-auto py-8 text-white">
                {orderDetails ? (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <form className="space-y-4" onSubmit={handleConfirm}>
                            <p><strong>Mã đơn hàng:</strong> {orderDetails.order_code}</p>

                            <div className="flex gap-6">
                                <div>
                                    <strong>Họ tên người nhận:</strong>
                                    <input
                                        type="text"
                                        name="delivery_full_name"
                                        value={form.delivery_full_name}
                                        onChange={handleChange}
                                        className="text-center ml-2 p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <strong>Số điện thoại:</strong>
                                    <input
                                        type="text"
                                        name="delivery_phone"
                                        value={form.delivery_phone}
                                        onChange={handleChange}
                                        className="text-center ml-2 p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div>
                                    <strong>Địa chỉ:</strong>
                                    <input
                                        type="text"
                                        name="delivery_address"
                                        value={form.delivery_address}
                                        onChange={handleChange}
                                        className="text-center ml-2 p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <strong>Phường:</strong>
                                    <input
                                        type="text"
                                        name="delivery_ward_name"
                                        value={form.delivery_ward_name}
                                        onChange={handleChange}
                                        className="text-center ml-2 p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex">
                                <strong>Ghi chú:</strong>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    className="w-60 ml-2 p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <p><strong>Phí vận chuyển:</strong> {Number(orderDetails.shipping_fee).toLocaleString('vi-VN')} VND</p>
                            <p><strong>Giảm giá:</strong> {Number(orderDetails.discount_amount).toLocaleString('vi-VN')} VND</p>
                            <p><strong>Tổng tiền:</strong> {Number(orderDetails.total_amount).toLocaleString('vi-VN')} VND</p>

                            <div className="flex items-center">
                                <strong>Phương thức thanh toán:</strong>
                                <select
                                    name="paymentMethod"
                                    value={form.paymentMethod}
                                    onChange={handleChange}
                                    className="text-center ml-2 p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cash">Thanh toán khi nhận hàng</option>
                                    <option value="card">Thanh toán bằng thẻ</option>
                                    <option value="transfer">Chuyển khoản ngân hàng</option>
                                    <option value="e-wallet">Ví điện tử</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="mt-4 py-2 px-4 rounded bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Xác nhận đặt hàng
                            </button>
                        </form>

                        <hr className="my-3" />

                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="border-b border-gray-700 py-2">Tên món</th>
                                    <th className="border-b border-gray-700 py-2">Số lượng</th>
                                    <th className="border-b border-gray-700 py-2">Giá</th>
                                    <th className="border-b border-gray-700 py-2">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderDetails.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border-b border-gray-700 py-2">{item.name}</td>
                                        <td className="border-b border-gray-700 py-2">{item.quantity}</td>
                                        <td className="border-b border-gray-700 py-2">{Number(item.price).toLocaleString('vi-VN')} VND</td>
                                        <td className="border-b border-gray-700 py-2">{item.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Đang tải chi tiết đơn hàng...</p>
                )}
            </div>
        </div>
    );
};

export default CheckoutPage;