import { useEffect, useMemo, useState } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import SideBarMenu from "../../components/admin/SideBarMenu";
import categoryApi from "../../api/categoryApi";
import menuTypeApi from "../../api/menu_typeApi";
import ConfirmModal from "../../components/admin/modals/ConfirmModal";

const initialFormData = {
    name: "",
    menuTypeId: ""
};

const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || fallbackMessage;
};

const MenuCategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [menuTypes, setMenuTypes] = useState([]);
    const [search, setSearch] = useState("");
    const [menuTypeFilter, setMenuTypeFilter] = useState("all");
    const [formData, setFormData] = useState(initialFormData);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = async ({ showLoading = false } = {}) => {
        if (showLoading) {
            setIsLoading(true);
        }

        try {
            const [categoryRes, menuTypeRes] = await Promise.all([
                categoryApi.getAll(),
                menuTypeApi.getAll()
            ]);

            const categoryData = categoryRes.data || [];
            const menuTypeData = menuTypeRes.data || [];

            setCategories(categoryData);
            setMenuTypes(menuTypeData);

            if (!formData.menuTypeId && menuTypeData.length > 0) {
                setFormData((prev) => ({ ...prev, menuTypeId: String(menuTypeData[0].id) }));
            }
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể tải dữ liệu danh mục thực đơn.")
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData({ showLoading: true });
    }, []);

    const categoryWithType = useMemo(() => {
        const map = new Map(menuTypes.map((type) => [Number(type.id), type.name]));

        return categories.map((category) => ({
            ...category,
            menu_type_name: map.get(Number(category.menu_type_id)) || "Không xác định"
        }));
    }, [categories, menuTypes]);

    const filteredCategories = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return categoryWithType.filter((category) => {
            const matchName = !keyword || String(category.name || "").toLowerCase().includes(keyword);
            const matchType = menuTypeFilter === "all" || Number(category.menu_type_id) === Number(menuTypeFilter);
            return matchName && matchType;
        });
    }, [categoryWithType, search, menuTypeFilter]);

    const stats = useMemo(() => {
        const groupedByType = filteredCategories.reduce((acc, category) => {
            const key = category.menu_type_name;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return {
            total: filteredCategories.length,
            groupedByType
        };
    }, [filteredCategories]);

    const resetForm = () => {
        setEditingCategoryId(null);
        setFormData({
            name: "",
            menuTypeId: menuTypes.length ? String(menuTypes[0].id) : ""
        });
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEdit = (category) => {
        setEditingCategoryId(category.id);
        setFormData({
            name: category.name || "",
            menuTypeId: String(category.menu_type_id || "")
        });
        setFeedback(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        try {
            const payload = {
                name: formData.name,
                menuTypeId: formData.menuTypeId
            };

            if (editingCategoryId) {
                await categoryApi.update(editingCategoryId, payload);
                setFeedback({ type: "success", message: "Cập nhật danh mục thành công." });
            } else {
                await categoryApi.create(payload);
                setFeedback({ type: "success", message: "Thêm danh mục thành công." });
            }

            await fetchData();
            resetForm();
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể lưu danh mục.")
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingCategory) {
            return;
        }

        setIsDeleting(true);
        setFeedback(null);

        try {
            await categoryApi.delete(deletingCategory.id);

            if (editingCategoryId === deletingCategory.id) {
                resetForm();
            }

            await fetchData();
            setFeedback({ type: "success", message: "Xóa danh mục thành công." });
            setDeletingCategory(null);
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể xóa danh mục.")
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="menu" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý danh mục thực đơn"
                    subtitle="Tạo danh mục, phân loại theo nhóm món và cập nhật thông tin hiển thị cho khu vực thực đơn."
                />

                <main className="p-6">
                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm danh mục theo tên..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={menuTypeFilter}
                                    onChange={(event) => setMenuTypeFilter(event.target.value)}
                                    className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="all">Loại món: Tất cả</option>
                                    {menuTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700">
                                    Tổng danh mục: <strong>{stats.total}</strong>
                                </span>
                                {Object.entries(stats.groupedByType).map(([typeName, total]) => (
                                    <span key={typeName} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                                        {typeName}: <strong>{total}</strong>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {feedback ? (
                            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                                {feedback.message}
                            </div>
                        ) : null}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <p className="text-xs font-semibold tracking-[0.2em] text-blue-500 uppercase">Biểu mẫu</p>
                                <h2 className="mt-2 text-xl font-bold text-slate-800">
                                    {editingCategoryId ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Chọn nhóm món tương ứng để hệ thống hiển thị danh mục chính xác ở trang thực đơn.
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tên danh mục</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        placeholder="Ví dụ: Món canh"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Loại món</label>
                                    <select
                                        name="menuTypeId"
                                        value={formData.menuTypeId}
                                        onChange={handleFormChange}
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        {menuTypes.map((type) => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Đang lưu..." : editingCategoryId ? "Lưu thay đổi" : "Thêm danh mục"}
                                    </button>
                                    {editingCategoryId ? (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Hủy
                                        </button>
                                    ) : null}
                                </div>
                            </form>
                        </article>

                        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h2 className="text-lg font-semibold text-slate-800">Danh sách danh mục</h2>
                                <p className="mt-1 text-sm text-slate-500">Sửa tên, đổi nhóm món hoặc xóa những danh mục không còn sử dụng.</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tên danh mục</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Loại món</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Thao tác</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                                    Đang tải danh mục thực đơn...
                                                </td>
                                            </tr>
                                        ) : null}

                                        {!isLoading && filteredCategories.map((category, index) => (
                                            <tr key={category.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{category.name}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{category.menu_type_name}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(category)}
                                                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 transition hover:bg-blue-100"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingCategory(category)}
                                                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 transition hover:bg-rose-100"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {!isLoading && filteredCategories.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                                    Không có danh mục phù hợp với bộ lọc hiện tại.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    </section>
                </main>
            </div>

            <ConfirmModal
                isOpen={Boolean(deletingCategory)}
                title="Xác nhận xóa danh mục"
                description={deletingCategory ? `Bạn có chắc muốn xóa danh mục \"${deletingCategory.name}\"? Hành động này không thể hoàn tác.` : ""}
                confirmText="Xóa danh mục"
                cancelText="Giữ lại"
                tone="danger"
                busy={isDeleting}
                onClose={() => setDeletingCategory(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default MenuCategoryManager;
