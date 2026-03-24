import { useEffect, useState } from "react";
import customerApi from "../../api/customerApi";
import wardApi from "../../api/wardApi";
import { notifyCustomer } from "../../utils/customerNotify";

const AddressManager = () => {
    const [addresses, setAddresses] = useState([]);
    const [wards, setWards] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ addressLine: "", wardId: "" });
    const [loading, setLoading] = useState(false);

    const emitAddressUpdated = () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("customerAddressUpdated"));
        }
    };

    useEffect(() => {
        fetchAddresses();
        fetchWards();
    }, []);

    const fetchAddresses = async () => {
        try {
            const response = await customerApi.getAddresses();
            setAddresses(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        }
    };

    const fetchWards = async () => {
        try {
            const response = await wardApi.getWards({
                page: 1,
                limit: 100,
                sortBy: "name",
                sortDir: "asc"
            });
            setWards(response.data.data || response.data || []);
        } catch (error) {
            console.error("Failed to fetch wards:", error);
        }
    };

    const handleAddClick = () => {
        setIsAdding(true);
        setEditingId(null);
        setFormData({ addressLine: "", wardId: "" });
    };

    const handleEditClick = (address) => {
        setEditingId(address.id);
        setIsAdding(false);
        setFormData({ addressLine: address.address_line, wardId: String(address.ward_id) });
    };

    const handleCancelClick = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ addressLine: "", wardId: "" });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.addressLine || !formData.wardId) {
            notifyCustomer({ message: "Vui lòng điền đầy đủ thông tin", type: "warning" });
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await customerApi.updateAddress(editingId, {
                    addressLine: formData.addressLine,
                    wardId: formData.wardId
                });
                notifyCustomer({ message: "Đã cập nhật địa chỉ.", type: "success" });
            } else {
                await customerApi.addAddress({
                    addressLine: formData.addressLine,
                    wardId: formData.wardId
                });
                notifyCustomer({ message: "Đã thêm địa chỉ mới.", type: "success" });
            }
            setIsAdding(false);
            setEditingId(null);
            setFormData({ addressLine: "", wardId: "" });
            await fetchAddresses();
            emitAddressUpdated();
        } catch (error) {
            console.error("Error saving address:", error);
            notifyCustomer({ message: "Không thể lưu địa chỉ", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
            return;
        }

        try {
            await customerApi.deleteAddress(id);
            await fetchAddresses();
            notifyCustomer({ message: "Đã xóa địa chỉ.", type: "success" });
            emitAddressUpdated();
        } catch (error) {
            console.error("Error deleting address:", error);
            notifyCustomer({ message: "Không thể xóa địa chỉ", type: "error" });
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await customerApi.setDefaultAddress(id);
            await fetchAddresses();
            notifyCustomer({ message: "Đã cập nhật địa chỉ mặc định.", type: "success" });
            emitAddressUpdated();
        } catch (error) {
            console.error("Error setting default address:", error);
            notifyCustomer({ message: "Không thể thiết lập địa chỉ mặc định", type: "error" });
        }
    };

    const getWardName = (wardId) => {
        const ward = wards.find((w) => String(w.id) === String(wardId));
        return ward ? ward.name : "N/A";
    };

    return (
        <div className="mt-12" data-aos="fade-up" data-aos-delay="100">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-[#e4c590]">Quản lý địa chỉ</h2>
                {!isAdding && editingId === null && (
                    <button
                        onClick={handleAddClick}
                        className="group relative overflow-hidden rounded-lg border border-[#e4c590]/60 px-5 py-2.5 text-sm font-semibold tracking-wider text-[#e4c590] cursor-pointer"
                    >
                        <span className="absolute inset-0 origin-left scale-x-0 bg-[#e4c590] transition-transform duration-500 group-hover:scale-x-100" />
                        <span className="relative z-10 transition-colors duration-500 group-hover:text-black">+ THÊM ĐỊA CHỈ</span>
                    </button>
                )}
            </div>

            {/* Form thêm/sửa địa chỉ */}
            {(isAdding || editingId !== null) && (
                <div className="mb-8 rounded-xl border border-white/10 bg-black/30 p-6">
                    <h3 className="mb-5 text-lg font-semibold text-white">
                        {editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
                    </h3>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <label className="lg:col-span-2 flex flex-col gap-1.5">
                            <span className="text-xs uppercase tracking-widest text-gray-400">Địa chỉ chi tiết</span>
                            <input
                                type="text"
                                name="addressLine"
                                value={formData.addressLine}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ (VD: 123 Đường ABC, Tòa nhà XYZ)"
                                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#e4c590] focus:outline-none transition-colors"
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs uppercase tracking-widest text-gray-400">Phường</span>
                            <select
                                name="wardId"
                                value={formData.wardId}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-[#e4c590] focus:outline-none transition-colors"
                            >
                                <option value="">-- Chọn phường --</option>
                                {wards.map((ward) => (
                                    <option key={ward.id} value={ward.id}>
                                        {ward.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="rounded-lg border border-green-500/50 px-5 py-3 text-sm font-semibold text-green-400 transition-colors hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                                {loading ? "ĐANG LƯU..." : "LƯU"}
                            </button>
                            <button
                                onClick={handleCancelClick}
                                className="rounded-lg border border-gray-500/40 px-5 py-3 text-sm font-semibold text-gray-400 transition-colors hover:border-gray-400 cursor-pointer"
                            >
                                HỦY
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Danh sách địa chỉ */}
            {addresses.length > 0 ? (
                <div className="space-y-3">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`rounded-xl border p-4 ${address.is_default
                                ? "border-[#e4c590]/40 bg-[#e4c590]/5"
                                : "border-white/10 bg-black/30"
                                }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-white">
                                        <p className="font-medium">{address.address_line}</p>
                                        {address.is_default && (
                                            <span className="rounded-full bg-[#e4c590]/20 px-2.5 py-1 text-xs font-semibold text-[#e4c590]">
                                                Mặc định
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-400">
                                        {getWardName(address.ward_id)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {!address.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(address.id)}
                                            className="rounded-md border border-[#e4c590]/30 px-3 py-1.5 text-xs font-semibold text-[#e4c590] transition-colors hover:bg-[#e4c590]/10 cursor-pointer"
                                        >
                                            Đặt làm mặc định
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEditClick(address)}
                                        className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-white/35 hover:text-white cursor-pointer"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.id)}
                                        className="rounded-md border border-red-500/35 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 cursor-pointer"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="rounded-xl border border-white/10 bg-black/30 px-4 py-5 text-sm text-gray-400">
                    {isAdding || editingId !== null
                        ? ""
                        : "Chưa có địa chỉ nào. Hãy thêm địa chỉ đầu tiên."
                    }
                </p>
            )}
        </div>
    );
};

export default AddressManager;
