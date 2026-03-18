import { useEffect, useState } from "react";
import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";
import AddToCartModal from "../../components/customer/AddToCartModal";
import cartApi from "../../api/cartApi";

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [modalItem, setModalItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchCartItems = async () => {
            try {
                const response = await cartApi.getAll();
                setCartItems(response.data);
            } catch (error) {
                console.error("Failed to fetch cart items:", error);
            }
        };
        fetchCartItems();
    }, []);

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
                    <p>Giỏ hàng trống.</p>
                ) : (
                    cartItems.map((item) => (
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
                            <button className="ml-auto cursor-pointer text-green-500"
                                onClick={() => handleUpdateClick(item)}
                            >
                                Cập nhật
                            </button>
                            <button className="cursor-pointer text-red-500"
                                onClick={() => handleDelete(item.menu_item_id)}
                            >
                                Xóa
                            </button>
                        </div>
                    ))
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

            <Footer />
        </div>
    );
};

export default CartPage;