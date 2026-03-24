import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import Header from "../../components/customer/Header";
import AddToCartModal from "../../components/customer/AddToCartModal";
import cartApi from "../../api/cartApi";
import orderApi from "../../api/orderApi";
import authApi from "../../api/authApi";
import { notifyCustomer } from "../../utils/customerNotify";

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [totalCartPrice, setTotalCartPrice] = useState(0);
    const [totalCartItems, setTotalCartItems] = useState(0);
    const [modalItem, setModalItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerInfo, setCustomerInfo] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

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
                setCustomerInfo(response.data?.data || response.data || null);
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
            await cartApi.updateCartItem(modalItem.menu_item_id, { quantity, note });
            setCartItems(cartItems.map(item =>
                item.menu_item_id === modalItem.menu_item_id
                    ? { ...item, quantity, note }
                    : item
            ));
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (error) {
            console.error("Failed to update cart item:", error);
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleCheckout = async () => {
        try {
            if (!customerInfo?.address_id || !customerInfo?.address || !customerInfo?.ward_name) {
                notifyCustomer({ message: "Vui lòng thiết lập địa chỉ mặc định trước khi thanh toán.", type: "warning" });
                navigate("/customers/me");
                return;
            }

            const orderData = {
                items: cartItems,
                shippingFee: Number(customerInfo?.shipping_fee || 0),
                discountAmount: 0,
                deliveryFullName: customerInfo ? `${customerInfo.full_name}` : "",
                deliveryPhone: customerInfo ? `${customerInfo.phone_number}` : "",
                deliveryAddress: customerInfo ? `${customerInfo.address}` : "",
                deliveryWardName: customerInfo ? `${customerInfo.ward_name}` : "",
            };
            const response = await orderApi.create(orderData);
            const orderCode = response.data.data.orderCode;
            navigate(`/orders/${orderCode}/checkout`);
        } catch (error) {
            console.error("Failed to create order:", error);
        }
    };

    const handleDeleteAll = async () => {
        try {
            if (confirm('Xóa toàn bộ giỏ hàng?')) {
                await cartApi.deleteAllCartItems();
                setCartItems([]);
                window.dispatchEvent(new Event("cartUpdated"));
            }
        } catch (error) {
            console.error("Failed to delete all cart items:", error);
        }
    };

    const handleDelete = async (menuItemId) => {
        try {
            await cartApi.deleteCartItem(menuItemId);
            setCartItems(cartItems.filter(item => item.menu_item_id !== menuItemId));
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (error) {
            console.error("Failed to delete cart item:", error);
        }
    };

    return (
        <div>
            <Header activePage={"cart"} />

            <div className="w-7xl mx-auto py-16 text-white">
                <div data-aos="fade-up" className="text-center mb-12">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Quản lý đơn hàng</p>
                    <h1 className="text-5xl font-bold mb-5">Giỏ hàng</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                {cartItems.length === 0 ? (
                    <div data-aos="fade-up" className="text-center py-20">
                        <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M2 2h1l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 8m12-8l2 8m-12 0h8m0 0a2 2 0 1 1 4 0m-4 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1 4 0m-4 0a2 2 0 1 0-4 0" />
                        </svg>
                        <h2 className="text-2xl font-semibold text-gray-400 mb-2">Giỏ hàng trống</h2>
                        <p className="text-gray-500 mb-6">Hãy thêm một vài món ăn yêu thích</p>
                        <button
                            onClick={() => navigate("/menus")}
                            className="group relative overflow-hidden px-8 py-3 border border-[#e4c590]/60 text-[#e4c590] rounded-lg cursor-pointer"
                        >
                            <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                            <span className="relative z-10 text-sm font-semibold group-hover:text-black transition-colors">TIẾP TỤC MUA HÀNG</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div data-aos="fade-up" className="bg-black/30 border border-white/10 rounded-xl p-6 mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Tạm tính ({totalCartItems} món)</p>
                                    <p className="text-4xl font-bold text-[#e4c590]">{Number(totalCartPrice).toLocaleString('vi-VN')}đ</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        className="group relative overflow-hidden px-8 py-3 border border-[#e4c590]/60 text-[#e4c590] rounded-lg cursor-pointer"
                                        onClick={handleCheckout}
                                    >
                                        <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                        <span className="relative z-10 text-sm font-semibold group-hover:text-black transition-colors">THANH TOÁN</span>
                                    </button>
                                    <button
                                        className="group relative overflow-hidden px-8 py-3 border border-red-500/40 text-red-400 rounded-lg cursor-pointer"
                                        onClick={handleDeleteAll}
                                    >
                                        <span className="absolute inset-0 bg-red-500 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                        <span className="relative z-10 text-sm font-semibold group-hover:text-black transition-colors">XÓA TẤT CẢ</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {cartItems.map((item, index) => (
                                <div key={item.id} data-aos="fade-up" data-aos-delay={index * 50} className="bg-black/30 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors flex items-center gap-12">
                                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-black/60">
                                        <img
                                            src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                                            alt={item.name}
                                            className="h-full mx-auto object-contain"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
                                        {item.note && (
                                            <p className="text-xs italic text-[#e4c590]/70 truncate">Ghi chú: {item.note}</p>
                                        )}
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase mb-0.5">Giá</p>
                                        <p className="text-sm font-semibold text-[#e4c590]">{Number(item.price).toLocaleString('vi-VN')}đ</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase mb-0.5">SL</p>
                                        <p className="text-sm font-semibold text-white">{item.quantity}</p>
                                    </div>

                                    <div className="text-right min-w-max">
                                        <p className="text-xs text-gray-500 uppercase mb-0.5">Thành tiền</p>
                                        <p className="text-sm font-bold text-[#e4c590]">{Number(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                                    </div>

                                    <div className="flex gap-1.5">
                                        <button
                                            className="px-2.5 py-1.5 text-xs bg-black/40 border border-[#e4c590]/30 text-[#e4c590] rounded hover:bg-black/60 transition-colors font-semibold cursor-pointer"
                                            onClick={() => handleUpdateClick(item)}
                                        >
                                            CẬP NHẬT
                                        </button>
                                        <button
                                            className="px-2.5 py-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors font-semibold cursor-pointer"
                                            onClick={() => handleDelete(item.menu_item_id)}
                                        >
                                            XÓA
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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