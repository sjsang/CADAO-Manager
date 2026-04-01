import { useEffect, useState } from "react";

import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import promotionApi from "../../api/promotionApi";
import menuTypeApi from "../../api/menu_typeApi";
import categoryApi from "../../api/categoryApi";
import menuItemApi from "../../api/menuApi";

const emptyForm = {
    name: "",
    description: "",
    discountType: "percent",
    discount_percent: "",
    discount_amount: "",
    start_time: "",
    end_time: "",
    priority: "",
    scope: "menu_type",
    menu_type_ids: [],
    category_ids: [],
    menu_item_ids: []
};

const PromotionManager = () => {
    const [promotions, setPromotions] = useState([]);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [menuTypes, setMenuTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [searchMenuType, setSearchMenuType] = useState("");
    const [searchCategory, setSearchCategory] = useState("");
    const [searchMenuItem, setSearchMenuItem] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const response = await promotionApi.getAll();
            setPromotions(response.data);
        } catch (error) {
            setError("Không thể tải danh sách khuyến mãi.");
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuTypes = async () => {
        try {
            const response = await menuTypeApi.getAll();
            setMenuTypes(response.data);
        } catch (error) {
            console.error("Không thể tải danh sách loại món:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryApi.getAll();
            setCategories(response.data);
        } catch (error) {
            console.error("Không thể tải danh sách danh mục:", error);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await menuItemApi.getAll();
            setMenuItems(response.data);
        } catch (error) {
            console.error("Không thể tải danh sách món ăn:", error);
        }
    };

    useEffect(() => {
        fetchPromotions();
        fetchMenuTypes();
        fetchCategories();
        fetchMenuItems();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
            setFormData((prev) => {
                const arr = prev[name] || [];
                if (checked) {
                    return { ...prev, [name]: [...arr, value] };
                } else {
                    return { ...prev, [name]: arr.filter((v) => v !== value) };
                }
            });
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleDiscountTypeChange = (e) => {
        const value = e.target.value;
        setFormData((prev) => ({
            ...prev,
            discountType: value,
            discount_percent: "",
            discount_amount: ""
        }));
    };

    const buildPayload = () => {
        let promotionData = {
            name: formData.name,
            description: formData.description,
            start_time: formData.start_time,
            end_time: formData.end_time,
            priority: formData.priority
        };
        if (formData.discountType === "percent") {
            promotionData.discount_percent = formData.discount_percent;
            promotionData.discount_amount = null;
        } else {
            promotionData.discount_amount = formData.discount_amount;
            promotionData.discount_percent = null;
        }
        promotionData.menu_type_ids = formData.scope === "menu_type" ? formData.menu_type_ids : [];
        promotionData.category_ids = formData.scope === "category" ? formData.category_ids : [];
        promotionData.menu_item_ids = formData.scope === "menu_item" ? formData.menu_item_ids : [];
        return promotionData;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            const payload = buildPayload();
            if (editingId) {
                await promotionApi.update(editingId, payload);
                setSuccess("Cập nhật khuyến mãi thành công!");
                setEditingId(null);
            } else {
                await promotionApi.create(payload);
                setSuccess("Thêm khuyến mãi thành công!");
            }
            setFormData({ ...emptyForm });
            fetchPromotions();
        } catch (error) {
            setError(editingId ? "Có lỗi khi cập nhật khuyến mãi." : "Có lỗi khi thêm khuyến mãi.");
        }
    };

    const handleEdit = async (promotion) => {
        setError("");
        setSuccess("");
        try {
            const response = await promotionApi.getById(promotion.id);
            const p = response.data;

            const hasMenuTypes = p.menu_types && p.menu_types.length > 0;
            const hasCategories = p.categories && p.categories.length > 0;
            const hasMenuItems = p.menu_items && p.menu_items.length > 0;

            let scope = "menu_type";
            if (hasMenuItems) scope = "menu_item";
            else if (hasCategories) scope = "category";

            setFormData({
                name: p.name || "",
                description: p.description || "",
                discountType: p.discount_percent ? "percent" : "amount",
                discount_percent: p.discount_percent || "",
                discount_amount: p.discount_amount || "",
                start_time: p.start_time ? new Date(p.start_time).toISOString().slice(0, 10) : "",
                end_time: p.end_time ? new Date(p.end_time).toISOString().slice(0, 10) : "",
                priority: p.priority || "",
                scope,
                menu_type_ids: hasMenuTypes ? p.menu_types.map(t => t.id.toString()) : [],
                category_ids: hasCategories ? p.categories.map(c => c.id.toString()) : [],
                menu_item_ids: hasMenuItems ? p.menu_items.map(m => m.id.toString()) : []
            });
            setEditingId(promotion.id);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            setError("Không thể tải thông tin khuyến mãi.");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ ...emptyForm });
        setError("");
        setSuccess("");
    };

    const handleDelete = async (id) => {
        try {
            await promotionApi.delete(id);
            setSuccess("Xóa khuyến mãi thành công!");
            setDeleteConfirm(null);
            fetchPromotions();
        } catch (error) {
            setError("Có lỗi khi xóa khuyến mãi.");
            setDeleteConfirm(null);
        }
    };

    const handleToggle = async (id) => {
        try {
            await promotionApi.toggle(id);
            fetchPromotions();
        } catch (error) {
            setError("Có lỗi khi thay đổi trạng thái khuyến mãi.");
        }
    };

    const handleRemoveSelected = (field, id) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((itemId) => itemId !== id.toString())
        }));
    };

    const getPromotionStatus = (promo) => {
        const now = new Date();
        const start = new Date(promo.start_time);
        const end = new Date(promo.end_time);
        if (!promo.is_active) return { label: "Tắt", color: "bg-slate-100 text-slate-600" };
        if (now < start) return { label: "Sắp diễn ra", color: "bg-blue-100 text-blue-700" };
        if (now > end) return { label: "Hết hạn", color: "bg-rose-100 text-rose-700" };
        return { label: "Đang hoạt động", color: "bg-green-100 text-green-700" };
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="promotions" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý khuyến mãi"
                    subtitle="Tạo, chỉnh sửa và quản lý các chương trình khuyến mãi."
                />

                <main className="p-6">
                    <section className="space-y-6">
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <p className="text-xs font-semibold tracking-[0.2em] text-blue-500 uppercase">Biểu mẫu</p>
                                <h2 className="mt-2 text-xl font-bold text-slate-800">
                                    {editingId ? "Chỉnh sửa chương trình khuyến mãi" : "Thêm chương trình khuyến mãi"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Chọn loại giảm giá và cấu hình giới hạn để kiểm soát chương trình khuyến mãi.
                                </p>
                            </div>


                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}
                                {success && <div className="text-green-600 text-sm font-semibold">{success}</div>}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tên chương trình</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: Khuyến mãi lễ 30/04"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Mô tả</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Mô tả chi tiết về chương trình khuyến mãi"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        rows={4}
                                        required
                                    />
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-1">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Loại giảm giá</label>
                                        <select
                                            name="discountType"
                                            value={formData.discountType}
                                            onChange={handleDiscountTypeChange}
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        >
                                            <option value="percent">Giảm theo phần trăm</option>
                                            <option value="amount">Giảm số tiền cố định</option>
                                        </select>
                                    </div>
                                    {formData.discountType === "percent" ? (
                                        <div className="flex-1">
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Phần trăm giảm (%)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                name="discount_percent"
                                                value={formData.discount_percent}
                                                onChange={handleChange}
                                                placeholder="Ví dụ: 15"
                                                className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                required
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-1">
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Số tiền giảm (VNĐ)</label>
                                            <input
                                                type="number"
                                                min="1000"
                                                step="1000"
                                                name="discount_amount"
                                                value={formData.discount_amount}
                                                onChange={handleChange}
                                                placeholder="Ví dụ: 30000"
                                                className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                required
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Ngày bắt đầu</label>
                                        <input
                                            type="date"
                                            name="start_time"
                                            value={formData.start_time}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Ngày kết thúc</label>
                                        <input
                                            type="date"
                                            name="end_time"
                                            value={formData.end_time}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Ưu tiên</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            placeholder="Ví dụ: 1"
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            required
                                        />
                                    </div>
                                </div>


                                <div className="flex gap-6">
                                    <div className="flex-1">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Phạm vi áp dụng</label>
                                        <select
                                            name="scope"
                                            value={formData.scope}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        >
                                            <option value="menu_type">Loại món</option>
                                            <option value="category">Danh mục</option>
                                            <option value="menu_item">Món ăn</option>
                                        </select>
                                    </div>

                                    <div className="flex-2">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Tìm kiếm</label>
                                        <input
                                            type="text"
                                            value={formData.scope === "menu_type" ? searchMenuType : formData.scope === "category" ? searchCategory : searchMenuItem}
                                            onChange={e => {
                                                if (formData.scope === "menu_type") {
                                                    setSearchMenuType(e.target.value);
                                                } else if (formData.scope === "category") {
                                                    setSearchCategory(e.target.value);
                                                } else {
                                                    setSearchMenuItem(e.target.value);
                                                }
                                            }}
                                            placeholder="Tìm kiếm..."
                                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                </div>

                                {(
                                    formData.menu_type_ids.length > 0 ||
                                    formData.category_ids.length > 0 ||
                                    formData.menu_item_ids.length > 0
                                ) && (
                                        <div className="mt-4">
                                            <p className="mb-2 text-sm font-semibold text-slate-700">
                                                Đã chọn:
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {/* Menu Types */}
                                                {formData.menu_type_ids.map((id) => {
                                                    const item = menuTypes.find((t) => t.id.toString() === id);
                                                    if (!item) return null;

                                                    return (
                                                        <span
                                                            key={`mt-${id}`}
                                                            className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                                                        >
                                                            {item.name}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveSelected("menu_type_ids", id)
                                                                }
                                                                className="text-blue-500 hover:text-blue-700"
                                                            >
                                                                ✕
                                                            </button>
                                                        </span>
                                                    );
                                                })}

                                                {/* Categories */}
                                                {formData.category_ids.map((id) => {
                                                    const item = categories.find((c) => c.id.toString() === id);
                                                    if (!item) return null;

                                                    return (
                                                        <span
                                                            key={`cat-${id}`}
                                                            className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                                                        >
                                                            {item.name}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveSelected("category_ids", id)
                                                                }
                                                                className="text-green-500 hover:text-green-700"
                                                            >
                                                                ✕
                                                            </button>
                                                        </span>
                                                    );
                                                })}

                                                {/* Menu Items */}
                                                {formData.menu_item_ids.map((id) => {
                                                    const item = menuItems.find((m) => m.id.toString() === id);
                                                    if (!item) return null;

                                                    return (
                                                        <span
                                                            key={`mi-${id}`}
                                                            className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700"
                                                        >
                                                            {item.name}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveSelected("menu_item_ids", id)
                                                                }
                                                                className="text-amber-500 hover:text-amber-700"
                                                            >
                                                                ✕
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                {formData.scope === "menu_type" && (
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                        {menuTypes.filter(type => type.name.toLowerCase().includes(searchMenuType.toLowerCase())).map((type) => (
                                            <label key={type.id} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 border border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    name="menu_type_ids"
                                                    value={type.id}
                                                    checked={formData.menu_type_ids.includes(type.id.toString())}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-700">{type.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {formData.scope === "category" && (
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                        {categories.filter(cat => cat.name.toLowerCase().includes(searchCategory.toLowerCase())).map((cat) => (
                                            <label key={cat.id} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 border border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    name="category_ids"
                                                    value={cat.id}
                                                    checked={formData.category_ids.includes(cat.id.toString())}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-700">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {formData.scope === "menu_item" && (
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                        {menuItems.filter(item => item.name.toLowerCase().includes(searchMenuItem.toLowerCase())).map((item) => (
                                            <label key={item.id} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 border border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    name="menu_item_ids"
                                                    value={item.id}
                                                    checked={formData.menu_item_ids.includes(item.id.toString())}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-700">{item.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={loading}
                                    >
                                        {loading ? "Đang xử lý..." : editingId ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi"}
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Hủy
                                        </button>
                                    )}
                                </div>
                            </form>

                        </article>

                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <p className="text-xs font-semibold tracking-[0.2em] text-blue-500 uppercase">Danh sách</p>
                                <h2 className="mt-2 text-xl font-bold text-slate-800">
                                    Các chương trình khuyến mãi
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Quản lý các chương trình khuyến mãi đã tạo.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                            <th className="w-60 px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tên chương trình</th>
                                            <th className="w-80 px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Mô tả</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Giảm giá</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày bắt đầu</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày kết thúc</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Áp dụng cho</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Độ ưu tiên</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Hành động</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {promotions.map((promotion, index) => {
                                            const status = getPromotionStatus(promotion);

                                            return (
                                                <tr key={promotion.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                                    <td className="px-4 py-3 text-sm font-semibold tracking-wide text-slate-800 uppercase">{promotion.name}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">{promotion.description}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">
                                                        {promotion.discount_percent
                                                            ? `${promotion.discount_percent}%`
                                                            : promotion.discount_amount
                                                                ? `${Number(promotion.discount_amount).toLocaleString('vi-VN')} VNĐ`
                                                                : "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">{new Date(promotion.start_time).toLocaleDateString('vi-VN')}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">{new Date(promotion.end_time).toLocaleDateString('vi-VN')}</td>
                                                    <td className="px-4 py-3 text-xs text-slate-700">
                                                        {promotion.menu_types.length > 0 && (
                                                            <div>
                                                                <ul className="space-y-1">
                                                                    {promotion.menu_types.map((type) => (
                                                                        <li className="bg-blue-50 rounded-lg px-3 py-1 border border-blue-200 text-blue-700" key={type.id}>{type.name}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {promotion.categories.length > 0 && (
                                                            <div>
                                                                <ul className="space-y-1">
                                                                    {promotion.categories.map((cat) => (
                                                                        <li className="bg-green-50 rounded-lg px-3 py-1 border border-green-200 text-green-700" key={cat.id}>{cat.name}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {promotion.menu_items.length > 0 && (
                                                            <div>
                                                                <ul className="space-y-1">
                                                                    {promotion.menu_items.map((item) => (
                                                                        <li className="bg-amber-50 rounded-lg px-3 py-1 border border-amber-200 text-amber-700" key={item.id}>{item.name}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-slate-700">{promotion.priority}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggle(promotion.id)}
                                                                className={`rounded-lg border px-3 py-1.5 font-medium transition ${promotion.is_active
                                                                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                                                    }`}
                                                            >
                                                                {promotion.is_active ? "Tắt" : "Bật"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(promotion)}
                                                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 transition hover:bg-blue-100"
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteConfirm(promotion.id)}
                                                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 transition hover:bg-rose-100"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {promotions.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                                                    Chưa có chương trình khuyến mãi nào.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    </section>

                    {/* Delete Confirmation Modal */}
                    {deleteConfirm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                            <div className="rounded-2xl bg-white p-6 shadow-xl max-w-sm w-full mx-4">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận xóa</h3>
                                <p className="text-sm text-slate-600 mb-5">
                                    Bạn có chắc chắn muốn xóa chương trình khuyến mãi này? Hành động không thể hoàn tác.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm)}
                                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default PromotionManager;