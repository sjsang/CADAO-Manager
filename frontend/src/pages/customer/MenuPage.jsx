import { useState, useEffect, useRef } from "react"
import AOS from "aos"
import menuApi from "../../api/menuApi"
import categoryApi from "../../api/categoryApi"
import menuTypeApi from "../../api/menu_typeApi"
import promotionApi from "../../api/promotionApi"
import Header from "../../components/customer/Header";
import MenuItem from "../../components/customer/MenuItem";
import CategorySection from "../../components/customer/CategorySection";

const MenuPage = () => {
    const [menuTypes, setMenuTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);

    const [selectedType, setSelectedType] = useState('Món ăn');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("name_asc");
    const [promotionMap, setPromotionMap] = useState({});
    const requestVersionRef = useRef(0);

    useEffect(() => {
        AOS.init({ duration: 700, easing: "ease-out-cubic", once: false, offset: 60 });
    }, []);

    useEffect(() => {
        menuTypeApi.getAll()
            .then((res) => setMenuTypes(res.data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        categoryApi.getAll()
            .then((res) => setCategories(res.data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        requestVersionRef.current += 1;
        const requestVersion = requestVersionRef.current;

        menuApi.getAll({
            type: selectedType,
            category: selectedCategory,
            search: searchTerm,
            sort: sortOrder,
            available: true
        })
            .then((res) => {
                if (requestVersion !== requestVersionRef.current) return;
                setMenuItems(res.data);
                AOS.refresh();
            })
            .catch(() => {
                if (requestVersion !== requestVersionRef.current) return;
                setMenuItems([]);
            });
    }, [selectedType, selectedCategory, searchTerm, sortOrder]);

    // Lấy khuyến mãi đang hoạt động cho các món hiện tại
    useEffect(() => {
        if (menuItems.length === 0) {
            setPromotionMap({});
            return;
        }
        const itemIds = menuItems.map(item => item.id);
        promotionApi.getActiveForItems(itemIds)
            .then(res => {
                const map = {};
                for (const promo of res.data) {
                    const itemId = promo.menu_item_id;
                    // Chỉ lấy khuyến mãi ưu tiên cao nhất cho mỗi món
                    if (!map[itemId] || promo.priority > map[itemId].priority) {
                        map[itemId] = promo;
                    }
                }
                setPromotionMap(map);
            })
            .catch(() => setPromotionMap({}));
    }, [menuItems]);

    const [showScrollTop, setShowScrollTop] = useState(false);

    const handleCategorySelect = (categoryName) => setSelectedCategory(categoryName);

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setSelectedCategory(null);
    };

    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <Header activePage={"menu"} />

            <div className="fixed top-34 left-0 bottom-0 w-56 border-r border-white/8 px-6 pt-4 overflow-y-auto text-white z-30">
                <div className="flex flex-col gap-8">
                    {menuTypes.map((type, index) => (
                        <CategorySection
                            key={type.id}
                            index={index}
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

            <div className="py-10 text-white">
                <div data-aos="fade-up" className="text-center mb-5">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Hương vị đậm đà, trải nghiệm trọn vẹn</p>
                    <h1 className="text-5xl font-bold mb-5">Khám phá thực đơn</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                <div className="w-7xl mx-auto">
                    <div data-aos="fade-up" className="flex items-center gap-3 mb-8 bg-black/30 border border-white/10 rounded-xl px-4 py-2 focus-within:border-[#e4c590] transition-colors">
                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm món..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none py-1"
                        />
                        <div className="w-px h-5 bg-white/10 shrink-0" />
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="bg-transparent text-gray-400 focus:outline-none cursor-pointer text-sm hover:text-[#e4c590] transition-colors"
                        >
                            <option className="text-black" value="name_asc">Tên: A → Z</option>
                            <option className="text-black" value="name_desc">Tên: Z → A</option>
                            <option className="text-black" value="price_asc">Giá: tăng dần</option>
                            <option className="text-black" value="price_desc">Giá: giảm dần</option>
                            <option className="text-black" value="sold_desc">Lượt bán: cao nhất</option>
                            <option className="text-black" value="sold_asc">Lượt bán: thấp nhất</option>
                            <option className="text-black" value="rating_desc">Đánh giá: cao nhất</option>
                            <option className="text-black" value="rating_asc">Đánh giá: thấp nhất</option>
                        </select>
                    </div>

                    {menuItems.length > 0 ? (
                        <div className="grid grid-cols-3 gap-8">
                            {menuItems.map((item, index) => (
                                <div key={item.id} data-aos="fade-up" data-aos-delay={(index % 3) * 100}>
                                    <MenuItem item={item} promotion={promotionMap[item.id]} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center mt-40 text-gray-500">
                            <p className="text-xl">Không tìm thấy món phù hợp.</p>
                        </div>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className={`fixed bottom-6 right-24 z-50 w-12 h-12 flex items-center justify-center rounded-full border-2 border-[#e4c590]/40 bg-black/60 backdrop-blur-sm text-[#e4c590] shadow-lg transition-all duration-300 cursor-pointer hover:bg-[#e4c590] hover:text-black hover:border-[#e4c590] ${showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                    }`}
                aria-label="Cuộn lên đầu trang"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="m18 15-6-6-6 6" />
                </svg>
            </button>
        </>
    );
}

export default MenuPage;