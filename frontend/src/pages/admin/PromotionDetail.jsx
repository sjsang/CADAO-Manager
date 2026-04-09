import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import promotionApi from "../../api/promotionApi";
import menuTypeApi from "../../api/menu_typeApi";
import categoryApi from "../../api/categoryApi";
import menuItemApi from "../../api/menuApi";
import { notifyCustomer } from "../../utils/customerNotify";

const PromotionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [menuTypes, setMenuTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [searchScope, setSearchScope] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [existingImage, setExistingImage] = useState(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
        discountType: "percent",
        discount_percent: "",
        discount_amount: "",
        start_time: "",
        end_time: "",
        scope: "menu_type",
        menu_type_ids: [],
        category_ids: [],
        menu_item_ids: [],
        applicable_rank: "all"
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [promoRes, mtRes, catRes, miRes] = await Promise.all([
                    promotionApi.getById(id),
                    menuTypeApi.getAll(),
                    categoryApi.getAll(),
                    menuItemApi.getAll()
                ]);

                setMenuTypes(mtRes.data || []);
                setCategories(catRes.data || []);
                setMenuItems(miRes.data || []);

                const p = promoRes.data;

                if (!p) {
                    notifyCustomer({ message: "Không tìm thấy khuyến mãi.", type: "error" });
                    navigate("/admin/promotions");
                    return;
                }

                const hasMenuTypes = p.menu_types && p.menu_types.length > 0;
                const hasCategories = p.categories && p.categories.length > 0;
                const hasMenuItems = p.menu_items && p.menu_items.length > 0;

                let scope = "all";
                if (hasMenuItems) scope = "menu_item";
                else if (hasCategories) scope = "category";
                else if (hasMenuTypes) scope = "menu_type";

                setForm({
                    name: p.name || "",
                    description: p.description || "",
                    discountType: p.discount_percent ? "percent" : "amount",
                    discount_percent: p.discount_percent || "",
                    discount_amount: p.discount_amount || "",
                    start_time: p.start_time ? new Date(p.start_time).toISOString().slice(0, 10) : "",
                    end_time: p.end_time ? new Date(p.end_time).toISOString().slice(0, 10) : "",
                    scope,
                    menu_type_ids: hasMenuTypes ? p.menu_types.map((t) => t.id.toString()) : [],
                    category_ids: hasCategories ? p.categories.map((c) => c.id.toString()) : [],
                    menu_item_ids: hasMenuItems ? p.menu_items.map((m) => m.id.toString()) : [],
                    applicable_rank: p.applicable_rank || "all"
                });
                if (p.image_url) setExistingImage(p.image_url);
            } catch {
                notifyCustomer({ message: "Không tải được chi tiết khuyến mãi.", type: "error" });
                navigate("/admin/promotions");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const onFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const handleDiscountTypeChange = (value) => {
        setForm((prev) => ({
            ...prev,
            discountType: value,
            discount_percent: "",
            discount_amount: ""
        }));
        setErrors((prev) => ({ ...prev, discount_percent: "", discount_amount: "" }));
    };

    const handleCheckboxChange = (field, value, checked) => {
        setForm((prev) => {
            const arr = prev[field] || [];
            if (checked) {
                return { ...prev, [field]: [...arr, value] };
            }
            return { ...prev, [field]: arr.filter((v) => v !== value) };
        });
    };

    const handleRemoveSelected = (field, id) => {
        setForm((prev) => ({
            ...prev,
            [field]: prev[field].filter((itemId) => itemId !== id.toString())
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Tên chương trình không được để trống.";
        }

        if (!form.description.trim()) {
            newErrors.description = "Mô tả không được để trống.";
        }

        if (form.discountType === "percent") {
            const percent = Number(form.discount_percent);
            if (!form.discount_percent || !Number.isFinite(percent) || percent < 1 || percent > 100) {
                newErrors.discount_percent = "Phần trăm giảm phải từ 1 đến 100.";
            }
        } else {
            const amount = Number(form.discount_amount);
            if (!form.discount_amount || !Number.isFinite(amount) || amount <= 0) {
                newErrors.discount_amount = "Số tiền giảm phải lớn hơn 0.";
            }
        }

        if (!form.start_time) {
            newErrors.start_time = "Vui lòng chọn ngày bắt đầu.";
        }

        if (!form.end_time) {
            newErrors.end_time = "Vui lòng chọn ngày kết thúc.";
        }

        if (form.start_time && form.end_time && new Date(form.start_time) >= new Date(form.end_time)) {
            newErrors.end_time = "Ngày kết thúc phải sau ngày bắt đầu.";
        }

        const scopeIds = form.scope === "menu_type" ? form.menu_type_ids : form.scope === "category" ? form.category_ids : form.menu_item_ids;
        if (form.scope !== "all" && scopeIds.length === 0) {
            newErrors.scope = "Vui lòng chọn ít nhất một mục trong phạm vi áp dụng.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                start_time: form.start_time,
                end_time: form.end_time,
                discount_percent: form.discountType === "percent" ? form.discount_percent : null,
                discount_amount: form.discountType === "amount" ? form.discount_amount : null,
                scope: form.scope,
                menu_type_ids: form.scope === "menu_type" ? form.menu_type_ids : [],
                category_ids: form.scope === "category" ? form.category_ids : [],
                menu_item_ids: form.scope === "menu_item" ? form.menu_item_ids : [],
                applicable_rank: form.applicable_rank
            };

            await promotionApi.update(id, payload, imageFile);
            notifyCustomer({ message: "Cập nhật khuyến mãi thành công.", type: "success" });
            navigate("/admin/promotions");
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.error || "Không thể cập nhật khuyến mãi. Vui lòng thử lại.";
            notifyCustomer({ message, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = (field) =>
        `w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors[field] ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`;

    const getScopeItems = () => {
        const keyword = searchScope.trim().toLowerCase();
        if (form.scope === "menu_type") {
            return menuTypes.filter((t) => t.name.toLowerCase().includes(keyword));
        }
        if (form.scope === "category") {
            return categories.filter((c) => c.name.toLowerCase().includes(keyword));
        }
        return menuItems.filter((m) => m.name.toLowerCase().includes(keyword));
    };

    const getScopeField = () => {
        if (form.scope === "menu_type") return "menu_type_ids";
        if (form.scope === "category") return "category_ids";
        return "menu_item_ids";
    };

    const getSelectedItems = () => {
        const field = getScopeField();
        const ids = form[field];
        const source = form.scope === "menu_type" ? menuTypes : form.scope === "category" ? categories : menuItems;
        return ids.map((id) => source.find((item) => item.id.toString() === id)).filter(Boolean);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="promotions" />
                <div className="flex flex-1 items-center justify-center text-slate-600">Đang tải dữ liệu khuyến mãi...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="promotions" />

            <div className="flex-1">
                <AdminHeader
                    title="Chi tiết khuyến mãi"
                    subtitle="Xem và chỉnh sửa thông tin chương trình khuyến mãi."
                />

                <div className="p-6">
                    <form onSubmit={handleSave} className="mx-auto max-w-3xl">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin chỉnh sửa</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Cập nhật loại giảm giá và phạm vi áp dụng cho chương trình khuyến mãi.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tên chương trình</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => onFieldChange("name", e.target.value)}
                                        className={inputClass("name")}
                                    />
                                    {errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name}</p> : null}
                                </div>

                                <div>                                    <label className="mb-2 block text-sm font-medium text-slate-700">Ảnh khuyến mãi</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            setImageFile(file || null);
                                            setImagePreview(file ? URL.createObjectURL(file) : null);
                                        }}
                                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {(imagePreview || existingImage) && (
                                        <img
                                            src={imagePreview || `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${existingImage}`}
                                            alt="Preview"
                                            className="mt-2 h-40 rounded-lg object-cover"
                                        />
                                    )}
                                </div>

                                <div>                                    <label className="mb-2 block text-sm font-medium text-slate-700">Mô tả</label>
                                    <textarea
                                        rows={4}
                                        value={form.description}
                                        onChange={(e) => onFieldChange("description", e.target.value)}
                                        className={inputClass("description")}
                                    />
                                    {errors.description ? <p className="mt-1 text-sm text-rose-600">{errors.description}</p> : null}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Loại giảm giá</label>
                                        <select
                                            value={form.discountType}
                                            onChange={(e) => handleDiscountTypeChange(e.target.value)}
                                            className={inputClass("discountType")}
                                        >
                                            <option value="percent">Giảm theo phần trăm</option>
                                            <option value="amount">Giảm số tiền cố định</option>
                                        </select>
                                    </div>

                                    {form.discountType === "percent" ? (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Phần trăm giảm (%)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={form.discount_percent}
                                                onChange={(e) => onFieldChange("discount_percent", e.target.value)}
                                                className={inputClass("discount_percent")}
                                            />
                                            {errors.discount_percent ? <p className="mt-1 text-sm text-rose-600">{errors.discount_percent}</p> : null}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Số tiền giảm (VNĐ)</label>
                                            <input
                                                type="number"
                                                min="1000"
                                                step="1000"
                                                value={form.discount_amount}
                                                onChange={(e) => onFieldChange("discount_amount", e.target.value)}
                                                className={inputClass("discount_amount")}
                                            />
                                            {errors.discount_amount ? <p className="mt-1 text-sm text-rose-600">{errors.discount_amount}</p> : null}
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Ngày bắt đầu</label>
                                        <input
                                            type="date"
                                            value={form.start_time}
                                            onChange={(e) => onFieldChange("start_time", e.target.value)}
                                            className={inputClass("start_time")}
                                        />
                                        {errors.start_time ? <p className="mt-1 text-sm text-rose-600">{errors.start_time}</p> : null}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Ngày kết thúc</label>
                                        <input
                                            type="date"
                                            value={form.end_time}
                                            onChange={(e) => onFieldChange("end_time", e.target.value)}
                                            className={inputClass("end_time")}
                                        />
                                        {errors.end_time ? <p className="mt-1 text-sm text-rose-600">{errors.end_time}</p> : null}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Phạm vi áp dụng</label>
                                        <select
                                            value={form.scope}
                                            onChange={(e) => onFieldChange("scope", e.target.value)}
                                            className={inputClass("scope")}
                                        >
                                            <option value="all">Tất cả</option>
                                            <option value="menu_type">Loại món</option>
                                            <option value="category">Danh mục</option>
                                            <option value="menu_item">Món ăn</option>
                                        </select>
                                        {errors.scope ? <p className="mt-1 text-sm text-rose-600">{errors.scope}</p> : null}
                                    </div>

                                    {form.scope !== "all" ? (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Tìm kiếm</label>
                                            <input
                                                type="text"
                                                value={searchScope}
                                                onChange={(e) => setSearchScope(e.target.value)}
                                                placeholder="Tìm kiếm..."
                                                className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </div>
                                    ) : null}
                                </div>

                                {form.scope !== "all" ? (
                                    <>
                                        {getSelectedItems().length > 0 ? (
                                            <div>
                                                <p className="mb-2 text-sm font-semibold text-slate-700">Đã chọn:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {getSelectedItems().map((item) => {
                                                        const field = getScopeField();
                                                        const colorMap = { menu_type_ids: "blue", category_ids: "green", menu_item_ids: "amber" };
                                                        const color = colorMap[field];
                                                        return (
                                                            <span
                                                                key={item.id}
                                                                className={`flex items-center gap-2 rounded-full bg-${color}-100 px-3 py-1 text-sm text-${color}-700`}
                                                            >
                                                                {item.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveSelected(field, item.id)}
                                                                    className={`text-${color}-500 hover:text-${color}-700`}
                                                                >
                                                                    ✕
                                                                </button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                            {getScopeItems().map((item) => {
                                                const field = getScopeField();
                                                return (
                                                    <label key={item.id} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 border border-gray-200">
                                                        <input
                                                            type="checkbox"
                                                            value={item.id}
                                                            checked={form[field].includes(item.id.toString())}
                                                            onChange={(e) => handleCheckboxChange(field, e.target.value, e.target.checked)}
                                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-slate-700">{item.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : null}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Áp dụng cho hạng khách hàng</label>
                                    <select
                                        value={form.applicable_rank}
                                        onChange={(e) => onFieldChange("applicable_rank", e.target.value)}
                                        className={inputClass("applicable_rank")}
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="normal">Khách hàng mới</option>
                                        <option value="loyal">Khách hàng thân quen</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/promotions")}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PromotionDetail;
