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
                const response = await menuApi.getAll(selectedType, selectedCategory);
                setMenuItems(response.data);
            } catch (error) {
                console.error("Failed to fetch menu items:", error);
            }
        };

        fetchMenuItems();
    }, [selectedType, selectedCategory]);

    const handleCategorySelect = (categoryName) => {
        setSelectedCategory(categoryName);
    };

    const handleTypeSelect = (type) => {
        setSelectedType(type);
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
                    <div className="sticky top-28 flex flex-col gap-8">
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
                    {menuItems.length > 0 ? (
                        <div className="grid grid-cols-3 gap-6">
                            {menuItems.map(item => (
                                <MenuItem key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center mt-80 text-gray-400">
                            <p className="text-xl">Danh mục tạm trống.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MenuPage