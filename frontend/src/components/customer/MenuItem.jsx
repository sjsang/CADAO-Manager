const MenuItem = ({ item }) => {
    return (
        <div key={item.id}>
            <div className="relative">
                <img
                    src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                    alt={item.name}
                    className="h-60 mx-auto object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-lg font-bold text-orange-600">
                    {Number(item.price).toLocaleString('vi-VN')}đ
                </div>
            </div>
            <p className="text-lg text-center font-bold my-2">
                {item.name}
            </p>
            <p className="text-gray-400 text-sm text-center">
                {item.description}
            </p>
            <button className="w-full mt-2 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-yellow-500 hover:text-black cursor-pointer transition-colors">
                Thêm vào phiếu gọi món
            </button>
        </div>
    );
}

export default MenuItem;