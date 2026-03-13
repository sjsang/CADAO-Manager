import { useState, useEffect } from "react"
import menuApi from "../../api/menuApi"
import categoryApi from "../../api/categoryApi"
import Header from "../../components/customer/Header";
import MenuItem from "../../components/customer/MenuItem";
import CategorySection from "../../components/customer/CategorySection";

const MenuPage = () => {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);

    const [selectedType, setSelectedType] = useState('Món ăn');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("name_asc");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryApi.getAll();
                setCategories(response.data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const response = await menuApi.getAll({
                    type: selectedType,
                    category: selectedCategory,
                    search: searchTerm,
                    sort: sortOrder
                });

                setMenuItems(response.data);
            } catch (error) {
                console.error("Failed to fetch menu items:", error);
            }
        };

        fetchMenuItems();
    }, [selectedType, selectedCategory, searchTerm, sortOrder]);

    const handleCategorySelect = (categoryName) => {
        setSelectedCategory(categoryName);
    };

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setSelectedCategory(null);
    };

    const menuTypes = [
        { id: 1, label: "Món Ăn", value: "Món ăn" },
        { id: 2, label: "Món Uống", value: "Món uống" }
    ];

    return (
        <>
            <Header activePage={"menu"} />

            <div className="max-w-7xl mx-auto flex gap-8 py-10 text-white">

                <div className="w-1/5 pr-8">
                    <div className="fixed top-34 flex flex-col gap-8">
                        {menuTypes.map(type => (
                            <CategorySection
                                key={type.id}
                                type={type}
                                categories={categories}
                                selectedType={selectedType}
                                selectedCategory={selectedCategory}
                                onSelectType={handleTypeSelect}
                                onSelectCategory={handleCategorySelect}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex-1">

                    <div className="flex gap-3 mb-6">
                        <input
                            type="text"
                            placeholder="Tìm món..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 p-3 rounded-lg bg-gray-800 text-white focus:outline-none"
                        />

                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="p-3 rounded-lg bg-gray-800 focus:outline-none"
                        >
                            <option value="name_asc">Tên: A → Z</option>
                            <option value="name_desc">Tên: Z → A</option>
                            <option value="price_asc">Giá: tăng dần</option>
                            <option value="price_desc">Giá: giảm dần</option>
                        </select>
                    </div>

                    {menuItems.length > 0 ? (
                        <div className="grid grid-cols-3 gap-6">
                            {menuItems.map(item => (
                                <MenuItem key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center mt-40 text-gray-400">
                            <p className="text-xl">Không tìm thấy món phù hợp.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MenuPage;