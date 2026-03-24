const CategorySection = ({
    type,
    categories,
    selectedType,
    selectedCategory,
    onSelectType,
    onSelectCategory,
    index = 0
}) => {

    const filteredCategories = categories.filter(
        cat => cat.menu_type_id === type.id
    );

    const isTypeActive = selectedType === type.name;

    return (
        <div
            style={{
                animation: `sidebarFadeIn 0.5s ease-out both`,
                animationDelay: `${index * 120}ms`,
            }}
        >
            <button
                type="button"
                onClick={() => {
                    onSelectType(type.name);
                    onSelectCategory(null);
                }}
                className="w-full flex items-center justify-between gap-2 mb-3 group cursor-pointer"
            >
                <span className={`font-bold text-base uppercase tracking-widest transition-colors ${isTypeActive ? "text-[#e4c590]" : "text-white/60 group-hover:text-white"
                    }`}>
                    {type.name}
                </span>
                <span className={`h-px flex-1 transition-colors ${isTypeActive ? "bg-[#e4c590]/40" : "bg-white/10"
                    }`} />
            </button>

            <div className="flex flex-col">
                {filteredCategories.map(category => {
                    const isActive = selectedCategory === category.name && isTypeActive;
                    return (
                        <div
                            key={category.id}
                            onClick={() => {
                                onSelectType(type.name);
                                onSelectCategory(category.name);
                            }}
                            className={`relative flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-200 rounded-r-lg ${isActive
                                ? "text-[#e4c590]"
                                : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-300 ${isActive ? "h-5 bg-[#e4c590]" : "h-0 bg-[#e4c590]"
                                }`} />
                            <span className={`text-sm transition-all duration-200 ${isActive ? "font-semibold translate-x-1" : ""
                                }`}>
                                {category.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CategorySection;