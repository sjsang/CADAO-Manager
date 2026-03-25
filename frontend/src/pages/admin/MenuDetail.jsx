import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import categoryApi from "../../api/categoryApi";
import menuApi from "../../api/menuApi";
import { notifyCustomer } from "../../utils/customerNotify";

const buildCloudinaryUrl = (publicId) => {
    if (!publicId) {
        return "";
    }

    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${publicId}`;
};

const MenuDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        isAvailable: true
    });

    const [originalImageId, setOriginalImageId] = useState("");
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [itemResponse, categoryResponse] = await Promise.all([
                    menuApi.getById(id),
                    categoryApi.getAll()
                ]);

                const item = itemResponse.data;
                const categoryData = categoryResponse.data || [];

                setCategories(categoryData);
                setForm({
                    name: item?.name || "",
                    description: item?.description || "",
                    price: item?.price ?? "",
                    categoryId: String(item?.category_id || categoryData[0]?.id || ""),
                    isAvailable: Boolean(item?.is_available)
                });
                setOriginalImageId(item?.image_url || "");
            } catch (error) {
                console.error("Failed to fetch menu item detail:", error);
                notifyCustomer({ message: "Không tải được chi tiết món ăn.", type: "error" });
                navigate("/admin/menus");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const previewUrl = useMemo(() => {
        if (imageFile) {
            return URL.createObjectURL(imageFile);
        }

        return buildCloudinaryUrl(originalImageId);
    }, [imageFile, originalImageId]);

    useEffect(() => {
        return () => {
            if (imageFile && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [imageFile, previewUrl]);

    const onFieldChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (!form.name.trim()) {
            notifyCustomer({ message: "Vui lòng nhập tên món.", type: "warning" });
            return false;
        }

        if (!form.price || Number(form.price) < 0) {
            notifyCustomer({ message: "Giá món ăn không hợp lệ.", type: "warning" });
            return false;
        }

        if (!form.categoryId) {
            notifyCustomer({ message: "Vui lòng chọn danh mục.", type: "warning" });
            return false;
        }

        return true;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

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

            await menuApi.update(id, payload);
            notifyCustomer({ message: "Đã cập nhật món ăn thành công.", type: "success" });
            navigate("/admin/menus");
        } catch (error) {
            console.error("Failed to update menu item:", error);
            notifyCustomer({ message: "Không thể cập nhật món ăn. Vui lòng thử lại.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="menu" />
                <div className="flex flex-1 items-center justify-center text-slate-600">Đang tải dữ liệu món ăn...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="menu" />

            <div className="flex-1">
                <AdminHeader
                    title="Chi tiết món ăn"
                    subtitle="Xem và chỉnh sửa thông tin món ăn trong thực đơn."
                />

                <div className="p-6">
                    <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-3">
                        <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin chỉnh sửa</h2>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="md:col-span-2">
                                    <span className="mb-2 block text-sm font-medium text-slate-700">Tên món</span>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => onFieldChange("name", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                            <p className="mt-2 text-sm text-slate-500">Chỉ cần chọn ảnh mới khi muốn thay đổi.</p>

                            <label className="mt-4 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600 hover:border-blue-400 hover:bg-blue-50">
                                Tải ảnh mới
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
                                        Món ăn này chưa có ảnh
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/menus")}
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

export default MenuDetail;