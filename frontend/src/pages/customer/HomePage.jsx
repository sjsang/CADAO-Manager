import { useNavigate } from "react-router-dom";

import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Header activePage={"home"} />

            <section className="h-150 w-7xl mx-auto mt-24 flex items-center justify-between">
                <div className="text-white w-1/2 flex flex-col gap-6">
                    <h1 className="text-5xl font-bold">Cadao Restaurant & Café</h1>
                    <p className="text-gray-300">Hơn 20 năm lan tỏa nét đẹp ẩm thực Việt, Ca Dao tự hào là nơi đầu tiên mang món Bún Huyền Mễ đến với thực khách trong và ngoài nước.
                        Mỗi món ăn tại Ca Dao là một “lời kể” về văn hóa, về con người Nam Bộ mộc mạc, chân chất.
                    </p>
                    <p className="text-gray-300">
                        Khám phá thực đơn đa dạng của chúng tôi, từ những món ăn truyền thống đậm đà hương vị đến những sáng tạo độc đáo, tất cả đều được chế biến từ những nguyên liệu tươi ngon nhất, mang đến trải nghiệm ẩm thực khó quên cho mọi thực khách.
                    </p>
                    <div
                        onClick={() => navigate("/menu")}
                        className="w-fit px-6 py-3 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition cursor-pointer"
                    >
                        Gọi món ngay
                    </div>
                </div>
                <img src="/spiner.png" alt="spiner" className="h-full animate-[spin_180s_linear_infinite]" />
            </section>

            <section className="w-7xl mx-auto py-24">
                <div className="grid md:grid-cols-2 gap-10 items-stretch">

                    <div className="group overflow-hidden rounded-2xl">
                        <img
                            src="/event-1.jpg"
                            alt="Sự kiện 8/3 Ca Dao"
                            className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                        />
                    </div>

                    <div className="flex flex-col justify-between gap-6">

                        <div className="group overflow-hidden rounded-2xl">
                            <img
                                src="/event-2.jpg"
                                alt="Không gian nhà hàng"
                                className="w-full h-80 object-cover transition duration-700 group-hover:scale-105"
                            />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold text-white leading-tight">
                                MỪNG NGÀY QUỐC TẾ PHỤ NỮ 8/3
                            </h2>

                            <p className="text-gray-300 leading-relaxed">
                                Nhân ngày Quốc tế Phụ nữ 8/3, Nhà hàng Ca Dao xin gửi đến một nửa yêu thương của thế giới
                                những lời chúc tốt đẹp và chân thành nhất. Chúc quý cô, quý chị luôn rạng rỡ,
                                hạnh phúc và trọn vẹn trong từng khoảnh khắc của cuộc sống. Hãy để Ca Dao đồng hành
                                cùng bạn trong ngày đặc biệt này bằng những bữa ăn ấm cúng, đậm đà hương vị quê nhà.
                            </p>

                            <button
                                className="mt-4 w-fit px-6 py-3 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition cursor-pointer"
                                onClick={() => navigate("/contact")}
                            >
                                Đặt bàn ngay
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default HomePage