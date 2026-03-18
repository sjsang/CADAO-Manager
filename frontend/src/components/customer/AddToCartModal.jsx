import { useState, useEffect } from "react";

const AddToCartModal = ({ item, isOpen, onClose, onSubmit, initialQuantity = 1, initialNote = "" }) => {
    const [quantity, setQuantity] = useState(initialQuantity);
    const [note, setNote] = useState(initialNote);

    useEffect(() => {
        if (isOpen) {
            setQuantity(initialQuantity);
            setNote(initialNote);
        }
    }, [isOpen, initialQuantity, initialNote]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (quantity <= 0) {
            alert("Số lượng không hợp lệ!");
            return;
        }
        onSubmit({ quantity, note });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white text-black rounded-xl p-6 w-80 shadow-lg relative">
                <h2 className="text-xl font-bold mb-4">{item.name}</h2>

                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Số lượng:</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Ghi chú:</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ví dụ: ít cay, không đá..."
                        className="w-full border rounded px-3 py-2 resize-none"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded bg-yellow-500 text-black font-bold hover:bg-yellow-600"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToCartModal;