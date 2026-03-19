import SideBarMenu from "../../components/admin/SideBarMenu";
import menuApi from "../../api/menuApi";
import { useEffect, useState } from "react";

const MenuManager = () => {
    const [menuItems, setMenuItems] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("name_asc");

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const response = await menuApi.getAll();
                setMenuItems(response.data);
            } catch (error) {
                console.error("Error fetching menu items:", error);
            }
        };

        fetchMenuItems();
    }, []);

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

    return (
        <div className="flex">
            <SideBarMenu activePage="menu" />

            <div className="flex-1">
                <div className="bg-gray-100 min-h-full p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="flex-1 text-2xl font-bold text-gray-700 mb-4">Quản lý thực đơn</h2>

                        <div className="flex-1 flex gap-3 mb-6">
                            <input
                                type="text"
                                placeholder="Tìm món..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 p-3 rounded-lg bg-white focus:outline-none"
                            />

                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="p-3 rounded-lg bg-white focus:outline-none"
                            >
                                <option value="name_asc">Tên: A → Z</option>
                                <option value="name_desc">Tên: Z → A</option>
                                <option value="price_asc">Giá: tăng dần</option>
                                <option value="price_desc">Giá: giảm dần</option>
                            </select>
                        </div>
                    </div>

                    {menuItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-lg mb-3">
                            <div className="h-20 w-30">
                                <img
                                    src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                                    alt={item.name}
                                    className="h-full mx-auto object-cover"
                                />
                            </div>
                            <div className="w-100">
                                <p className="text-gray-500">Tên món:</p>
                                <h2 className="text-lg">{item.name}</h2>
                            </div>
                            <div className="w-35 ml-auto">
                                <p className="text-gray-500">Giá:</p>
                                <p className="text-lg">{Number(item.price).toLocaleString('vi-VN')}đ</p>
                            </div>
                            <div className="w-35 ml-auto">
                                <p className="text-gray-500">Trạng thái:</p>
                                <p
                                    className={`${item.is_available ? "text-green-500" : "text-red-500"} text-lg`}
                                >{item.is_available ? "Có sẵn" : "Hết hàng"}</p>
                            </div>
                            <div className="ml-auto">
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                    Sửa
                                </button>
                                <button className="ml-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MenuManager;