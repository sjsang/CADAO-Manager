import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import categoryApi from "../../api/categoryApi";
import menuTypeApi from "../../api/menu_typeApi";
import { notifyCustomer } from "../../utils/customerNotify";
import ConfirmModal from "../../components/admin/modals/ConfirmModal";

const CategoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [menuTypes, setMenuTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        name: "",
        menuTypeId: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [categoriesRes, menuTypeRes] = await Promise.all([
                    categoryApi.getAll(),
                    menuTypeApi.getAll()
                ]);

                const allCategories = categoriesRes.data || [];
                const menuTypeData = menuTypeRes.data || [];
                setMenuTypes(menuTypeData);

                const category = allCategories.find((c) => String(c.id) === String(id));

                if (!category) {
                    notifyCustomer({ message: "Không tìm thấy danh mục.", type: "error" });
                    navigate("/admin/menu-categories");
                    return;
                }

                setForm({
                    name: category.name || "",
                    menuTypeId: String(category.menu_type_id || menuTypeData[0]?.id || "")
                });
            } catch {
                notifyCustomer({ message: "Không tải được chi tiết danh mục.", type: "error" });
                navigate("/admin/menu-categories");
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

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Tên danh mục không được để trống.";
        }

        if (!form.menuTypeId) {
            newErrors.menuTypeId = "Vui lòng chọn loại món.";
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
            await categoryApi.update(id, {
                name: form.name.trim(),
                menuTypeId: form.menuTypeId
            });

            notifyCustomer({ message: "Cập nhật danh mục thành công.", type: "success" });
            navigate("/admin/menu-categories");
        } catch (error) {
            const message = error.response?.data?.message || "Không thể cập nhật danh mục. Vui lòng thử lại.";
            notifyCustomer({ message, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="menu" />
                <div className="flex flex-1 items-center justify-center text-slate-600">Đang tải dữ liệu danh mục...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="menu" />

            <div className="flex-1">
                <AdminHeader
                    title="Chi tiết danh mục"
                    subtitle="Xem và chỉnh sửa thông tin danh mục thực đơn."
                />

                <div className="p-6">
                    <form onSubmit={handleSave} className="mx-auto max-w-2xl">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin chỉnh sửa</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Chọn nhóm món tương ứng để hệ thống hiển thị danh mục chính xác ở trang thực đơn.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tên danh mục</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => onFieldChange("name", e.target.value)}
                                        className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.name ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`}
                                    />
                                    {errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Loại món</label>
                                    <select
                                        value={form.menuTypeId}
                                        onChange={(e) => onFieldChange("menuTypeId", e.target.value)}
                                        className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.menuTypeId ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`}
                                    >
                                        {menuTypes.map((type) => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    {errors.menuTypeId ? <p className="mt-1 text-sm text-rose-600">{errors.menuTypeId}</p> : null}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/menu-categories")}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Xóa
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>

                            <ConfirmModal
                                isOpen={showDeleteModal}
                                title="Xóa danh mục"
                                description="Bạn có chắc muốn xóa danh mục này? Hành động không thể hoàn tác."
                                confirmText="Xóa"
                                cancelText="Hủy"
                                tone="danger"
                                busy={isDeleting}
                                onClose={() => setShowDeleteModal(false)}
                                onConfirm={async () => {
                                    setIsDeleting(true);
                                    try {
                                        await categoryApi.delete(id);
                                        notifyCustomer({ message: "Đã xóa danh mục.", type: "success" });
                                        navigate("/admin/menu-categories");
                                    } catch {
                                        notifyCustomer({ message: "Xóa danh mục thất bại.", type: "error" });
                                    } finally {
                                        setIsDeleting(false);
                                        setShowDeleteModal(false);
                                    }
                                }}
                            />
                        </section>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CategoryDetail;
