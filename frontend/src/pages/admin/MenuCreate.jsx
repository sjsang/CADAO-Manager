import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import categoryApi from "../../api/categoryApi";
import menuApi from "../../api/menuApi";

const MenuCreate = () => {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        isAvailable: true
    });

    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryApi.getAll();
                setCategories(response.data || []);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                alert("Không tải được danh mục món ăn.");
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        if (!form.categoryId && categories.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: String(categories[0].id) }));
        }
    }, [categories, form.categoryId]);

    const previewUrl = useMemo(() => {
        if (!imageFile) {
            return "";
        }

        return URL.createObjectURL(imageFile);
    }, [imageFile]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const onFieldChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (!form.name.trim()) {
            alert("Vui lòng nhập tên món.");
            return false;
        }

        if (!form.price || Number(form.price) < 0) {
            alert("Giá món ăn không hợp lệ.");
            return false;
        }

        if (!form.categoryId) {
            alert("Vui lòng chọn danh mục.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = new FormData();
            payload.append("name", form.name.trim());
            payload.append("description", form.description.trim());
            payload.append("price", String(Number(form.price)));
            payload.append("categoryId", form.categoryId);
            payload.append("isAvailable", String(form.isAvailable));

            if (imageFile) {
                payload.append("image", imageFile);
            }

            await menuApi.create(payload);
            alert("Đã thêm món ăn thành công.");
            navigate("/admin/menus");
        } catch (error) {
            console.error("Failed to create menu item:", error);
            alert("Không thể thêm món ăn. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="menu" />

            <div className="flex-1">
                <AdminHeader
                    title="Thêm món mới"
                    subtitle="Tạo món ăn mới để hiển thị trên thực đơn khách hàng."
                />

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-3">
                        <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin món ăn</h2>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="md:col-span-2">
                                    <span className="mb-2 block text-sm font-medium text-slate-700">Tên món</span>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => onFieldChange("name", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="Ví dụ: Gà nướng mật ong"
                                    />
                                </label>

                                <label>
                                    <span className="mb-2 block text-sm font-medium text-slate-700">Giá (VND)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={form.price}
                                        onChange={(e) => onFieldChange("price", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="0"
                                    />
                                </label>

                                <label>
                                    <span className="mb-2 block text-sm font-medium text-slate-700">Danh mục</span>
                                    <select
                                        value={form.categoryId}
                                        onChange={(e) => onFieldChange("categoryId", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="md:col-span-2">
                                    <span className="mb-2 block text-sm font-medium text-slate-700">Mô tả</span>
                                    <textarea
                                        rows={5}
                                        value={form.description}
                                        onChange={(e) => onFieldChange("description", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        placeholder="Mô tả hương vị, khẩu phần, thành phần nổi bật..."
                                    />
                                </label>

                                <label className="md:col-span-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <input
                                        type="checkbox"
                                        checked={form.isAvailable}
                                        onChange={(e) => onFieldChange("isAvailable", e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Món đang mở bán (hiển thị cho khách hàng)</span>
                                </label>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Hình ảnh món</h2>
                            <p className="mt-2 text-sm text-slate-500">Bạn có thể bỏ trống để cập nhật ảnh sau.</p>

                            <label className="mt-4 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600 hover:border-blue-400 hover:bg-blue-50">
                                Chọn ảnh từ máy
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />
                            </label>

                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Ảnh món ăn" className="w-full aspect-square object-contain" />
                                ) : (
                                    <div className="flex h-56 items-center justify-center text-sm text-slate-500">
                                        Chưa có ảnh xem trước
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/menus")}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isSubmitting ? "Đang lưu..." : "Lưu món ăn"}
                                </button>
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MenuCreate;