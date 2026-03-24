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

            <section className="h-screen w-7xl mx-auto -mt-20 flex items-center justify-between">
                <div className="text-white w-1/2 flex-1 flex flex-col gap-12">
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
                <div className="flex-1">
                    <img src="/spiner1.png" alt="spiner" className="animate-[spin_180s_linear_infinite]" />
                </div>
            </section>

            <section className="w-7xl mx-auto py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white">Vì sao chọn chúng tôi?</h2>
                    <p className="mt-3 text-gray-400">Ba giá trị cốt lõi tạo nên trải nghiệm ẩm thực khác biệt tại Ca Dao</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-2xl bg-gray-800 p-6 border border-gray-700">
                        <img src="https://tastycs-react.vercel.app/img/icons/1.svg" alt="" />
                        <h3 className="text-xl font-semibold text-yellow-400 mb-3">Thực đơn chuẩn cơm quê nhà</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Món ăn đậm chất Việt, gần gũi như bữa cơm gia đình với hương vị thân thuộc và nguyên liệu tươi ngon mỗi ngày.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-gray-800 p-6 border border-gray-700">
                        <img src="https://tastycs-react.vercel.app/img/icons/2.svg" alt="" />
                        <h3 className="text-xl font-semibold text-yellow-400 mb-3">Chất lượng tạo nên thương hiệu</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Quy trình chế biến chỉn chu, kiểm soát chất lượng chặt chẽ để mỗi món ăn luôn ổn định và xứng đáng với niềm tin của khách hàng.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-gray-800 p-6 border border-gray-700">
                        <img src="https://tastycs-react.vercel.app/img/icons/3.svg" alt="" />
                        <h3 className="text-xl font-semibold text-yellow-400 mb-3">Phục vụ nhanh chóng</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Đội ngũ linh hoạt, thao tác nhanh gọn giúp bạn có món trong thời gian ngắn nhưng vẫn đảm bảo chất lượng và sự chu đáo.
                        </p>
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