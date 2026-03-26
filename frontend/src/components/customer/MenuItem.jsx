import { useState } from "react";
import AddToCartModal from "./AddToCartModal";
import cartApi from "../../api/cartApi";
import { notifyCustomer } from "../../utils/customerNotify";

const MenuItem = ({ item }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAddToCart = async ({ quantity, note }) => {
        setLoading(true);
        try {
            await cartApi.addToCart({ menuItemId: item.id, quantity, note });
            notifyCustomer({ message: "Thêm vào giỏ hàng thành công!", type: "success" });
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (error) {
            console.error("Failed to add item to cart:", error);
            notifyCustomer({ message: "Thêm vào giỏ hàng thất bại!", type: "error" });
        } finally {
            setLoading(false);
            setIsModalOpen(false);
        }
    };

    return (
        <div>
            <div className="relative">
                <div className="w-full h-60">
                    <img
                        src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                        alt={item.name}
                        className="h-full mx-auto object-cover"
                    />
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-[#e4c590] border border-[#e4c590]/40">
                    {Number(item.price).toLocaleString('vi-VN')}đ
                </div>
            </div>
            <p className="text-base text-center font-semibold mt-3">{item.name}</p>
            <div className="flex items-center justify-center gap-3 text-xs my-3">
                {item.avg_rating > 0 &&
                    <>
                        <span className="text-gray-400">({Number(item.rating_count || 0)} đánh giá)</span>
                        <span className="text-amber-300 font-semibold">★ {Number(item.avg_rating).toFixed(1)}/5</span>
                    </>
                }
                <span className="text-gray-500">Đã bán: {Number(item.sold_count || 0)}</span>
            </div>
            <p className="text-gray-400 text-sm text-center leading-relaxed">{item.description}</p>
            <button
                className="group relative overflow-hidden w-full mt-3 py-2.5 border border-[#e4c590] text-[#e4c590] cursor-pointer"
                onClick={() => setIsModalOpen(true)}
                disabled={loading}
            >
                <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 ease-in-out group-hover:scale-x-100"></span>
                <span className="relative z-10 text-sm font-bold tracking-wider transition-colors duration-500 group-hover:text-black">
                    THÊM VÀO GIỎ
                </span>
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