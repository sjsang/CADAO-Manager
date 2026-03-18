import { useState } from "react";
import AddToCartModal from "./AddToCartModal";
import cartApi from "../../api/cartApi";

const MenuItem = ({ item }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAddToCart = async ({ quantity, note }) => {
        setLoading(true);
        try {
            await cartApi.addToCart({ menuItemId: item.id, quantity, note });
            alert("Thêm vào giỏ hàng thành công!");
        } catch (error) {
            console.error("Failed to add item to cart:", error);
            alert("Thêm vào giỏ hàng thất bại!");
        } finally {
            setLoading(false);
            setIsModalOpen(false);
        }
    };

    return (
        <div key={item.id}>
            <div className="relative">
                <div className="w-full h-60">
                    <img
                        src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                        alt={item.name}
                        className="h-full mx-auto object-cover"
                    />
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-lg font-bold text-orange-600">
                    {Number(item.price).toLocaleString('vi-VN')}đ
                </div>
            </div>
            <p className="text-lg text-center font-bold my-2">{item.name}</p>
            <p className="text-gray-400 text-sm text-center">{item.description}</p>
            <button
                className="w-full mt-2 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-yellow-500 hover:text-black cursor-pointer transition-colors"
                onClick={() => setIsModalOpen(true)}
                disabled={loading}
            >
                Thêm vào phiếu gọi món
            </button>

            <AddToCartModal
                item={item}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddToCart}
            />
        </div>
    );
};

export default MenuItem;