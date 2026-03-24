import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { notifyCustomer } from "../../utils/customerNotify";

const AddToCartModal = ({ item, isOpen, onClose, onSubmit, initialQuantity = 1, initialNote = "" }) => {
    const [quantity, setQuantity] = useState(initialQuantity);
    const [note, setNote] = useState(initialNote);

    useEffect(() => {
        if (isOpen) {
            setQuantity(initialQuantity);
            setNote(initialNote);
        }
    }, [isOpen, initialQuantity, initialNote]);

    if (!isOpen || typeof document === "undefined") return null;

    const handleSubmit = () => {
        if (quantity <= 0) {
            notifyCustomer({ message: "Số lượng không hợp lệ!", type: "warning" });
            return;
        }
        onSubmit({ quantity, note });
        onClose();
    };

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    return createPortal((
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-linear-to-b from-black/40 to-black/60 border border-white/10 text-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="Đóng"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-6 text-center">
                    {item.image_url && (
                        <div className="h-40 w-40 mx-auto mb-4 rounded-xl overflow-hidden flex items-center justify-center">
                            <img
                                src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                                alt={item.name}
                                className="h-full mx-auto object-contain"
                            />
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-[#e4c590]">{item.name}</h2>
                    {item.price && (
                        <p className="text-lg text-gray-400 mt-2">{Number(item.price).toLocaleString('vi-VN')}đ</p>
                    )}
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-white/20 to-transparent mb-6" />

                <div className="mb-6">
                    <label className="block text-sm uppercase tracking-widest text-gray-400 mb-3">Số lượng</label>
                    <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-lg p-2">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/40 hover:bg-[#e4c590]/20 transition-colors text-[#e4c590] font-bold text-xl"
                            aria-label="Giảm"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 bg-transparent text-center text-white font-bold text-xl focus:outline-none"
                        />
                        <button
                            onClick={() => handleQuantityChange(1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/40 hover:bg-[#e4c590]/20 transition-colors text-[#e4c590] font-bold text-xl"
                            aria-label="Tăng"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm uppercase tracking-widest text-gray-400 mb-2">Ghi chú (tùy chọn)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ví dụ: ít cay, không đá, thêm chanh..."
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#e4c590] transition-colors resize-none text-sm"
                        rows={3}
                    />
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-white/20 to-transparent mb-6" />

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-500/40 text-gray-400 hover:border-gray-400 hover:text-gray-300 transition-colors font-semibold uppercase tracking-widest text-sm"
                    >
                        HỦY
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 group relative overflow-hidden px-4 py-3 rounded-lg border border-[#e4c590]/60 text-[#e4c590] font-semibold uppercase tracking-widest text-sm"
                    >
                        <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                        <span className="relative z-10 group-hover:text-black transition-colors">XÁC NHẬN</span>
                    </button>
                </div>
            </div>
        </div>
    ), document.body);
};

export default AddToCartModal;