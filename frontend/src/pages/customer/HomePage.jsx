import { useNavigate } from "react-router-dom";

import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Header activePage={"home"} />

            <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 h-150 w-7xl flex items-center justify-between">
                <div className="text-white w-1/2 flex flex-col gap-6">
                    <h1 className="text-5xl font-bold">Cadao Restaurant & Café</h1>
                    <p>Hơn 20 năm lan tỏa nét đẹp ẩm thực Việt, Ca Dao tự hào là nơi đầu tiên mang món Bún Huyền Mễ đến với thực khách trong và ngoài nước.
                        Mỗi món ăn tại Ca Dao là một “lời kể” về văn hóa, về con người Nam Bộ mộc mạc, chân chất.
                    </p>
                    <p>
                        Khám phá thực đơn đa dạng của chúng tôi, từ những món ăn truyền thống đậm đà hương vị đến những sáng tạo độc đáo, tất cả đều được chế biến từ những nguyên liệu tươi ngon nhất, mang đến trải nghiệm ẩm thực khó quên cho mọi thực khách.
                    </p>
                    <div
                        onClick={() => navigate("/menu")}
                        className="bg-yellow-500 hover:bg-yellow-300 transition w-fit px-4 py-2 rounded font-medium text-black cursor-pointer"
                    >
                        GỌI MÓN NGAY
                    </div>
                </div>
                <img src="/spiner.png" alt="spiner" className="h-full animate-[spin_180s_linear_infinite]" />
            </div>

            <Footer />
        </>
    );
}

export default HomePage