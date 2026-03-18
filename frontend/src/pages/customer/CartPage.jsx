import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/customer/Header";
import AddToCartModal from "../../components/customer/AddToCartModal";
import cartApi from "../../api/cartApi";
import orderApi from "../../api/orderApi";
import authApi from "../../api/authApi";

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [totalCartPrice, setTotalCartPrice] = useState(0);
    const [totalCartItems, setTotalCartItems] = useState(0);
    const [modalItem, setModalItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerInfo, setCustomerInfo] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCartItems = async () => {
            try {
                const response = await cartApi.getAll();
                setCartItems(response.data.items);
            } catch (error) {
                console.error("Failed to fetch cart items:", error);
            }
        };
        fetchCartItems();
    }, []);

    useEffect(() => {
        const fetchCustomerInfo = async () => {
            try {
                const response = await authApi.me();

                setCustomerInfo(response.data);
            } catch (error) {
                console.error("Failed to fetch customer info:", error);
            }
        };
        fetchCustomerInfo();
    }, []);

    useEffect(() => {
        const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        setTotalCartPrice(totalPrice);
        setTotalCartItems(totalItems);
    }, [cartItems]);

    const handleUpdateClick = (item) => {
        setModalItem(item);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async ({ quantity, note }) => {
        try {
            await cartApi.updateCartItem({ menuItemId: modalItem.menu_item_id, quantity, note });
            setCartItems(cartItems.map(item =>
                item.menu_item_id === modalItem.menu_item_id
                    ? { ...item, quantity, note }
                    : item
            ));
        } catch (error) {
            console.error("Failed to update cart item:", error);
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleCheckout = async () => {
        try {
            const orderData = {
                items: cartItems,
                shippingFee: 0,
                discountAmount: 0,
                deliveryFullName: customerInfo ? `${customerInfo.full_name}` : "",
                deliveryPhone: customerInfo ? `${customerInfo.phone_number}` : "",
                deliveryAddress: customerInfo ? `${customerInfo.address}` : "",
                deliveryWardName: customerInfo ? `${customerInfo.ward_name}` : "",
            };
            const response = await orderApi.create(orderData);
            const orderCode = response.data.data.orderCode;
            navigate(`/checkout/${orderCode}`);
        } catch (error) {
            console.error("Failed to create order:", error);
        }
    };

    const handleDeleteAll = async () => {
        try {
            if (confirm('Xóa toàn bộ giỏ hàng?')) {
                await cartApi.deleteAllCartItems();
                setCartItems([]);
            }
        } catch (error) {
            console.error("Failed to delete all cart items:", error);
        }
    };

    const handleDelete = async (menuItemId) => {
        try {
            await cartApi.deleteCartItem({ menuItemId });
            setCartItems(cartItems.filter(item => item.menu_item_id !== menuItemId));
        } catch (error) {
            console.error("Failed to delete cart item:", error);
        }
    };

    return (
        <div>
            <Header activePage={"cart"} />

            <div className="w-7xl mx-auto py-8 text-white">
                {cartItems.length === 0 ? (
                    <p className="text-center gap-4 mb-4 p-4 bg-gray-800 rounded-lg">Giỏ hàng trống.</p>
                ) : (
                    <>
                        <div className="flex items-center gap-4 mb-4 p-4 bg-gray-700 rounded-lg">
                            <div className="flex-1">
                                <span>Tạm tính ({totalCartItems} món):</span>
                                <span className="ml-3 text-lg">{Number(totalCartPrice).toLocaleString('vi-VN')}đ</span>
                            </div>
                            <button className="bg-blue-500 px-4 py-2 rounded duration-300 cursor-pointer hover:bg-blue-600"
                                onClick={handleCheckout}
                            >
                                Thanh toán
                            </button>
                            <button className="bg-orange-500 px-4 py-2 rounded duration-300 cursor-pointer hover:bg-orange-600"
                                onClick={handleDeleteAll}
                            >
                                Xóa tất cả
                            </button>
                        </div>

                        {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 mb-4 p-4 bg-gray-800 rounded-lg">

                                <div className="h-20 w-30">
                                    <img
                                        src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                                        alt={item.name}
                                        className="h-full mx-auto object-cover"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <p className="text-lg">{item.name}</p>
                                    {item.note && <p className="text-sm italic text-orange-400">Ghi chú: {item.note}</p>}
                                </div>
                                <div className="w-30 mx-auto text-center">
                                    <p className="text-sm text-gray-400">Số lượng</p>
                                    <p className="text-lg">{item.quantity}</p>
                                </div>
                                <div className="w-40 mx-auto text-center">
                                    <p className="text-sm text-gray-400">Đơn giá</p>
                                    <p className="text-lg">{Number(item.price).toLocaleString('vi-VN')}đ</p>
                                </div>
                                <button className="ml-auto cursor-pointer hover:underline text-orange-500"
                                    onClick={() => handleUpdateClick(item)}
                                >
                                    Cập nhật
                                </button>
                                <button className="cursor-pointer hover:underline text-red-500"
                                    onClick={() => handleDelete(item.menu_item_id)}
                                >
                                    Xóa
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {modalItem && (
                <AddToCartModal
                    item={modalItem}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    initialQuantity={modalItem.quantity}
                    initialNote={modalItem.note || ""}
                />
            )}
        </div>
    );
};

export default CartPage;