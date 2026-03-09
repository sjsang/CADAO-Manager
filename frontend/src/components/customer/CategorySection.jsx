const CategorySection = ({
    type,
    categories,
    selectedType,
    selectedCategory,
    onSelectType,
    onSelectCategory
}) => {

    const filteredCategories = categories.filter(
        cat => cat.menu_type_id === type.id
    );

    return (
        <div>
            <h3
                onClick={() => {
                    onSelectType(type.value);
                    onSelectCategory(null);
                }}
                className={`font-bold text-xl mb-4 cursor-pointer transition-colors ${selectedType === type.value
                        ? "text-yellow-500"
                        : "hover:text-yellow-500"
                    }`}
            >
                {type.label}
            </h3>

            <div className="flex flex-col gap-2 pl-2">
                {filteredCategories.map(category => (
                    <div
                        key={category.id}
                        onClick={() => {
                            onSelectType(type.value);
                            onSelectCategory(category.name);
                        }}
                        className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedCategory === category.name
                                ? "bg-yellow-500 text-black font-medium"
                                : "hover:bg-yellow-100 hover:text-black"
                            }`}
                    >
                        {category.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategorySection;