import { useState, useEffect } from 'react';
import customerApi from '../../api/customerApi';
import wardApi from '../../api/wardApi';

const AddressManager = () => {
    const [addresses, setAddresses] = useState([]);
    const [wards, setWards] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ addressLine: '', wardId: '' });
    const [loading, setLoading] = useState(false);

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
            const response = await wardApi.getWards();
            setWards(response.data.data || response.data || []);
        } catch (error) {
            console.error("Failed to fetch wards:", error);
        }
    };

    const handleAddClick = () => {
        setIsAdding(true);
        setEditingId(null);
        setFormData({ addressLine: '', wardId: '' });
    };

    const handleEditClick = (address) => {
        setEditingId(address.id);
        setIsAdding(false);
        setFormData({ addressLine: address.address_line, wardId: address.ward_id });
    };

    const handleCancelClick = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ addressLine: '', wardId: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.addressLine || !formData.wardId) {
            alert("Vui lòng điền đầy đủ thông tin");
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await customerApi.updateAddress(editingId, {
                    addressLine: formData.addressLine,
                    wardId: formData.wardId
                });
            } else {
                await customerApi.addAddress({
                    addressLine: formData.addressLine,
                    wardId: formData.wardId
                });
            }
            setIsAdding(false);
            setEditingId(null);
            setFormData({ addressLine: '', wardId: '' });
            fetchAddresses();
        } catch (error) {
            console.error("Error saving address:", error);
            alert("Không thể lưu địa chỉ");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
            return;
        }

        try {
            await customerApi.deleteAddress(id);
            fetchAddresses();
        } catch (error) {
            console.error("Error deleting address:", error);
            alert("Không thể xóa địa chỉ");
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await customerApi.setDefaultAddress(id);
            fetchAddresses();
        } catch (error) {
            console.error("Error setting default address:", error);
            alert("Không thể thiết lập địa chỉ mặc định");
        }
    };

    const getWardName = (wardId) => {
        const ward = wards.find(w => w.id === wardId);
        return ward ? ward.name : 'N/A';
    };

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-white">Quản lý địa chỉ</h2>
                {!isAdding && editingId === null && (
                    <button
                        onClick={handleAddClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                        + Thêm địa chỉ
                    </button>
                )}
            </div>

            {/* Form thêm/sửa địa chỉ */}
            {(isAdding || editingId !== null) && (
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-white mb-4">
                        {editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-300 block mb-2">Địa chỉ chi tiết</label>
                            <input
                                type="text"
                                name="addressLine"
                                value={formData.addressLine}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ (VD: 123 Đường ABC, Tòa nhà XYZ)"
                                className="w-full p-2 rounded bg-gray-600 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-gray-300 block mb-2">Phường</label>
                            <select
                                name="wardId"
                                value={formData.wardId}
                                onChange={handleInputChange}
                                className="w-full p-2 rounded bg-gray-600 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Chọn phường --</option>
                                {wards.map(ward => (
                                    <option key={ward.id} value={ward.id}>
                                        {ward.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                                onClick={handleCancelClick}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Danh sách địa chỉ */}
            {addresses.length > 0 ? (
                <div className="space-y-3">
                    {addresses.map(address => (
                        <div
                            key={address.id}
                            className={`p-4 rounded border-l-4 ${address.is_default
                                    ? 'bg-gray-700 border-l-green-500'
                                    : 'bg-gray-800 border-l-gray-600'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="text-white flex items-center gap-2">
                                        <p>{address.address_line}</p>
                                        {address.is_default && (
                                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                                Mặc định
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {getWardName(address.ward_id)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {!address.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(address.id)}
                                            className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
                                        >
                                            Đặt làm mặc định
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEditClick(address)}
                                        className="text-yellow-400 hover:text-yellow-300 text-sm cursor-pointer"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.id)}
                                        className="text-red-400 hover:text-red-300 text-sm cursor-pointer"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400">
                    {isAdding || editingId !== null
                        ? ''
                        : 'Chưa có địa chỉ nào. Hãy thêm địa chỉ đầu tiên.'
                    }
                </p>
            )}
        </div>
    );
};

export default AddressManager;
