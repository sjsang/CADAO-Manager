import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader";
import SideBarMenu from "../../components/admin/SideBarMenu";
import categoryApi from "../../api/categoryApi";
import menuTypeApi from "../../api/menu_typeApi";
import ConfirmModal from "../../components/admin/modals/ConfirmModal";

const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || fallbackMessage;
};

const MenuCategoryManager = () => {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [menuTypes, setMenuTypes] = useState([]);
    const [search, setSearch] = useState("");
    const [menuTypeFilter, setMenuTypeFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
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

            setCategories(categoryRes.data || []);
            setMenuTypes(menuTypeRes.data || []);
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

    const handleConfirmDelete = async () => {
        if (!deletingCategory) {
            return;
        }

        setIsDeleting(true);
        setFeedback(null);

        try {
            await categoryApi.delete(deletingCategory.id);
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

                                <button
                                    className="rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600"
                                    onClick={() => navigate("/admin/menu-categories/add")}
                                >
                                    Thêm danh mục
                                </button>
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

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-800">Danh sách danh mục</h2>
                            <p className="mt-1 text-sm text-slate-500">Nhấn vào hàng để chỉnh sửa, hoặc xóa những danh mục không còn sử dụng.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tên danh mục</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Loại món</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Đang tải danh mục thực đơn...
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading && filteredCategories.map((category, index) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-slate-50 cursor-pointer"
                                            onClick={() => navigate(`/admin/menu-categories/${category.id}`)}
                                        >
                                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{category.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{category.menu_type_name}</td>
                                        </tr>
                                    ))}

                                    {!isLoading && filteredCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có danh mục phù hợp với bộ lọc hiện tại.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>

            <ConfirmModal
                isOpen={Boolean(deletingCategory)}
                title="Xác nhận xóa danh mục"
                description={deletingCategory ? `Bạn có chắc muốn xóa danh mục "${deletingCategory.name}"? Hành động này không thể hoàn tác.` : ""}
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
