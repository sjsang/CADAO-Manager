import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import menuApi from "../../api/menuApi";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const MenuManager = () => {
    const navigate = useNavigate();

    const [menuItems, setMenuItems] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("name_asc");

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const response = await menuApi.getAll({
                    search: searchTerm,
                    sort: sortOrder
                });

                setMenuItems(response.data);
            } catch (error) {
                console.error("Failed to fetch menu items:", error);
            }
        };

        fetchMenuItems();
    }, [searchTerm, sortOrder]);

    const availableCount = useMemo(() => {
        return menuItems.filter((item) => item.is_available).length;
    }, [menuItems]);

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
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <input
                                type="text"
                                placeholder="Tìm món..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />

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
                                className="rounded-lg bg-blue-500 p-3 text-white hover:bg-blue-600"
                                onClick={() => navigate("/admin/menus/add")}
                            >
                                Thêm món
                            </button>
                        </div>

                        <p className="mt-3 text-sm text-slate-500">
                            Tổng món: <span className="font-semibold text-slate-700">{menuItems.length}</span> | Có sẵn: <span className="font-semibold text-emerald-600">{availableCount}</span>
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ảnh</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tên món</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Mô tả</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Giá</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {menuItems.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50 cursor-pointer"
                                            onClick={() => navigate(`/admin/menus/${item.id}`)}
                                        >
                                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
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
                                            <td className="max-w-xs px-4 py-3 text-sm text-slate-700">{item.description || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{Number(item.price || 0).toLocaleString("vi-VN")}đ</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.is_available ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                    {item.is_available ? "Có sẵn" : "Hết hàng"}
                                                </span>
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
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MenuManager;