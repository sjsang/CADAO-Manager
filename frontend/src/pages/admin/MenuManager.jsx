import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import menuApi from "../../api/menuApi";
import menuTypeApi from "../../api/menu_typeApi";
import categoryApi from "../../api/categoryApi";
import TablePagination from "../../components/admin/TablePagination";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 8;

const MenuManager = () => {
    const navigate = useNavigate();

    const [menuItems, setMenuItems] = useState([]);
    const [menuTypes, setMenuTypes] = useState([]);
    const [categories, setCategories] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [availabilityFilter, setAvailabilityFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("name_asc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [menuTypesRes, categoriesRes] = await Promise.all([
                    menuTypeApi.getAll(),
                    categoryApi.getAll()
                ]);

                setMenuTypes(menuTypesRes.data || []);
                setCategories(categoriesRes.data || []);
            } catch (error) {
                console.error("Failed to fetch menu filter options:", error);
            }
        };

        fetchFilterOptions();
    }, []);

    const categoryOptions = useMemo(() => {
        if (typeFilter === "all") {
            return categories;
        }

        const selectedType = menuTypes.find((type) => String(type.name) === String(typeFilter));
        if (!selectedType) {
            return [];
        }

        return categories.filter((category) => Number(category.menu_type_id) === Number(selectedType.id));
    }, [categories, menuTypes, typeFilter]);

    useEffect(() => {
        if (categoryFilter === "all") {
            return;
        }

        const stillValid = categoryOptions.some((category) => String(category.name) === String(categoryFilter));
        if (!stillValid) {
            setCategoryFilter("all");
        }
    }, [categoryOptions, categoryFilter]);

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const params = {
                    search: searchTerm,
                    sort: sortOrder,
                    page,
                    limit: PAGE_SIZE
                };

                if (typeFilter !== "all") {
                    params.type = typeFilter;
                }

                if (categoryFilter !== "all") {
                    params.category = categoryFilter;
                }

                if (availabilityFilter !== "all") {
                    params.available = availabilityFilter;
                }

                const response = await menuApi.getAll(params);
                const data = response.data?.data || [];

                setMenuItems(data);
                setPagination(response.data?.pagination || { page, limit: PAGE_SIZE, totalItems: data.length, totalPages: 1 });
            } catch (error) {
                console.error("Failed to fetch menu items:", error);
            }
        };

        fetchMenuItems();
    }, [searchTerm, typeFilter, categoryFilter, availabilityFilter, sortOrder, page]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, typeFilter, categoryFilter, availabilityFilter, sortOrder]);

    const availableCount = useMemo(() => {
        return menuItems.filter((item) => item.is_available).length;
    }, [menuItems]);

    const unavailableCount = Math.max(0, menuItems.length - availableCount);

    const resetFilters = () => {
        setSearchTerm("");
        setTypeFilter("all");
        setCategoryFilter("all");
        setAvailabilityFilter("all");
        setSortOrder("name_asc");
    };

    const handleToggleFeatured = async (e, item) => {
        e.stopPropagation();
        setTogglingId(item.id);
        try {
            const response = await menuApi.toggleFeatured(item.id);
            if (response.data?.success) {
                setMenuItems((prev) =>
                    prev.map((m) =>
                        m.id === item.id ? { ...m, is_featured: response.data.data.is_featured } : m
                    )
                );
            }
        } catch (error) {
            console.error("Failed to toggle featured:", error);
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="menu" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý thực đơn"
                    subtitle="Cập nhật tình trạng món ăn, giá bán và hình ảnh hiển thị."
                />

                <div className="p-6">
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <input
                                type="text"
                                placeholder="Tìm món..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 min-w-55 rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="all">Loại món: Tất cả</option>
                                {menuTypes.map((type) => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))}
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="all">Danh mục: Tất cả</option>
                                {categoryOptions.map((category) => (
                                    <option key={category.id} value={category.name}>{category.name}</option>
                                ))}
                            </select>

                            <select
                                value={availabilityFilter}
                                onChange={(e) => setAvailabilityFilter(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="all">Trạng thái: Tất cả</option>
                                <option value="true">Có sẵn</option>
                                <option value="false">Hết hàng</option>
                            </select>

                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="name_asc">Tên: A → Z</option>
                                <option value="name_desc">Tên: Z → A</option>
                                <option value="price_asc">Giá: tăng dần</option>
                                <option value="price_desc">Giá: giảm dần</option>
                            </select>

                            <button
                                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-700 transition hover:bg-slate-50"
                                onClick={resetFilters}
                            >
                                Xóa lọc
                            </button>

                            <button
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-700 transition hover:bg-indigo-100"
                                onClick={() => navigate("/admin/menu-categories")}
                            >
                                Quản lý danh mục
                            </button>

                            <button
                                className="rounded-lg bg-blue-500 p-3 text-white hover:bg-blue-600"
                                onClick={() => navigate("/admin/menus/add")}
                            >
                                Thêm món
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700">
                                Tổng món: <strong>{menuItems.length}</strong>
                            </span>
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                                Có sẵn: <strong>{availableCount}</strong>
                            </span>
                            <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-rose-700">
                                Hết hàng: <strong>{unavailableCount}</strong>
                            </span>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ảnh</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tên món</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Giá</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">Nổi bật</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {menuItems.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-slate-50 cursor-pointer ${item.is_featured ? "bg-amber-50" : ""}`}
                                            onClick={() => navigate(`/admin/menus/${item.id}`)}
                                        >
                                            <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                            <td>
                                                {item.image_url ? (
                                                    <div className="h-15 w-25">
                                                        <img
                                                            src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                                                            alt={item.name}
                                                            className="h-full mx-auto object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-15 w-25 items-center justify-center rounded bg-slate-100 text-sm text-slate-400">
                                                        Không có ảnh
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{Number(item.price || 0).toLocaleString("vi-VN")}đ</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.is_available ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                    {item.is_available ? "Có sẵn" : "Hết hàng"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={(e) => handleToggleFeatured(e, item)}
                                                    disabled={togglingId === item.id}
                                                    title={item.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                                                    className={`text-xl transition-opacity ${togglingId === item.id ? "opacity-40" : "hover:opacity-70"} ${item.is_featured ? "text-amber-400" : "text-slate-300"}`}
                                                >
                                                    {item.is_featured ? "★" : "☆"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {menuItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có món ăn phù hợp từ khóa tìm kiếm.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>

                        <TablePagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            totalItems={pagination.totalItems}
                            onPageChange={setPage}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MenuManager;