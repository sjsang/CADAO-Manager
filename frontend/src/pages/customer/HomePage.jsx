import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";
import reviewApi from "../../api/reviewApi";

const StarRow = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={s <= rating ? "text-yellow-400" : "text-gray-600"}>★</span>
        ))}
    </div>
);

const HomePage = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        reviewApi.getRecentReviews(6)
            .then((res) => setReviews(res.data?.data || []))
            .catch(() => setReviews([]));
    }, []);

    return (
        <>
            <Header activePage={"home"} />

            <section className="h-150 w-7xl mx-auto mt-20 flex items-center justify-between">
                <div className="text-white w-1/2 flex flex-col gap-6">
                    <h1 className="text-5xl font-bold">Cadao Restaurant & Café</h1>
                    <p className="text-gray-300">Hơn 20 năm lan tỏa nét đẹp ẩm thực Việt, Ca Dao tự hào là nơi đầu tiên mang món Bún Huyền Mễ đến với thực khách trong và ngoài nước.
                        Mỗi món ăn tại Ca Dao là một “lời kể” về văn hóa, về con người Nam Bộ mộc mạc, chân chất.
                    </p>
                    <p className="text-gray-300">
                        Khám phá thực đơn đa dạng của chúng tôi, từ những món ăn truyền thống đậm đà hương vị đến những sáng tạo độc đáo, tất cả đều được chế biến từ những nguyên liệu tươi ngon nhất, mang đến trải nghiệm ẩm thực khó quên cho mọi thực khách.
                    </p>
                    <div
                        onClick={() => navigate("/menus")}
                        className="w-fit px-6 py-3 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition cursor-pointer"
                    >
                        Chọn món ngay
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

            {reviews.length > 0 && (
                <section className="w-7xl mx-auto py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white">Khách hàng nói gì về chúng tôi</h2>
                        <p className="mt-3 text-gray-400">Những trải nghiệm thực tế từ khách hàng đã dùng dịch vụ của Ca Dao</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {reviews.map((review) => (
                            <div key={review.id} className="rounded-2xl bg-gray-800 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <img
                                        src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${review.customer_avatar}`}
                                        alt={review.customer_name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />

                                    <div>
                                        <p className="font-semibold text-white mb-1">{review.customer_name}</p>
                                        <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <StarRow rating={Number(review.rating)} />
                                <p className="flex-1 leading-relaxed text-gray-300">{review.content}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <Footer />
        </>
    );
}

export default HomePage