import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";

import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";
import reviewApi from "../../api/reviewApi";
import menuApi from "../../api/menuApi";
import cartApi from "../../api/cartApi";
import AddToCartModal from "../../components/customer/AddToCartModal";
import { notifyCustomer } from "../../utils/customerNotify";

const StarRow = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`text-3xl ${s <= rating ? "text-yellow-500" : "text-gray-600"}`}>★</span>
        ))}
    </div>
);

const HomePage = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [bestSellerItems, setBestSellerItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [activeReview, setActiveReview] = useState(0);
    const [activeSection, setActiveSection] = useState("home-hero");
    const isAutoSnappingRef = useRef(false);
    const snapTimerRef = useRef(null);

    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: false,
            offset: 80,
        });
    }, []);

    const sectionDots = useMemo(() => [
        { id: "home-hero", label: "Mở đầu" },
        { id: "home-featured", label: "Món nổi bật" },
        { id: "home-why", label: "Vì sao chọn Ca Dao" },
        ...(reviews.length > 0 ? [{ id: "home-reviews", label: "Đánh giá" }] : [])
    ], [reviews.length]);

    useEffect(() => {
        if (reviews.length <= 1) return;

        const timer = setTimeout(() => {
            setActiveReview((prev) => (prev + 1) % reviews.length);
        }, 5000);

        return () => clearTimeout(timer);
    }, [reviews.length, activeReview]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const featured = await reviewApi.getFeaturedReviews();
                const featuredData = featured.data?.data || [];
                setReviews(featuredData);
            } catch {
                setReviews([]);
            } finally {
                AOS.refresh();
            }
        };

        fetchReviews();
    }, []);

    useEffect(() => {
        if (activeReview >= reviews.length) setActiveReview(0);
    }, [reviews.length]);

    useEffect(() => {
        menuApi.getFeatured()
            .then((res) => { setBestSellerItems(res.data || []); AOS.refresh(); })
            .catch(() => setBestSellerItems([]));
    }, []);

    useEffect(() => {
        const clearSnapTimer = () => {
            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
                snapTimerRef.current = null;
            }
        };

        const detectActiveSection = () => {
            const focusLine = window.innerHeight * 0.35;
            let active = sectionDots[0]?.id || "home-hero";
            let minDistance = Number.POSITIVE_INFINITY;

            sectionDots.forEach((section) => {
                const element = document.getElementById(section.id);
                if (!element) return;

                const rect = element.getBoundingClientRect();
                if (rect.top <= focusLine && rect.bottom >= focusLine) {
                    active = section.id;
                    minDistance = -1;
                    return;
                }

                if (minDistance !== -1) {
                    const distance = Math.abs(rect.top - focusLine);
                    if (distance < minDistance) {
                        minDistance = distance;
                        active = section.id;
                    }
                }
            });

            setActiveSection(active);
        };

        const getNearestSectionTarget = () => {
            const viewportCenter = window.innerHeight / 2;
            const threshold = window.innerHeight * 0.3;
            let nearest = null;

            sectionDots.forEach((section) => {
                const element = document.getElementById(section.id);
                if (!element) return;

                const rect = element.getBoundingClientRect();
                const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);

                if (!nearest || distance < nearest.distance) {
                    nearest = { distance, rect };
                }
            });

            if (!nearest || nearest.distance > threshold) return null;

            return Math.max(0, window.scrollY + nearest.rect.top + nearest.rect.height / 2 - viewportCenter);
        };

        const onScroll = () => {
            detectActiveSection();

            if (!isAutoSnappingRef.current) {
                clearSnapTimer();
                snapTimerRef.current = setTimeout(() => {
                    const targetY = getNearestSectionTarget();
                    if (targetY === null || Math.abs(window.scrollY - targetY) < 8) return;

                    isAutoSnappingRef.current = true;
                    window.scrollTo({ top: targetY, behavior: "smooth" });
                    setTimeout(() => { isAutoSnappingRef.current = false; }, 500);
                }, 120);
            }
        };

        detectActiveSection();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", detectActiveSection);

        return () => {
            clearSnapTimer();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", detectActiveSection);
        };
    }, [sectionDots]);

    const handleDotClick = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (!element) {
            return;
        }

        isAutoSnappingRef.current = true;

        const rect = element.getBoundingClientRect();
        const sectionCenterY = window.scrollY + rect.top + rect.height / 2;
        const targetY = Math.max(0, sectionCenterY - window.innerHeight / 2);

        window.scrollTo({ top: targetY, behavior: "smooth" });

        setTimeout(() => {
            isAutoSnappingRef.current = false;
        }, 500);
    };

    const handleOpenAddToCart = (item) => setSelectedItem(item);

    const handleAddToCart = async ({ quantity, note }) => {
        if (!selectedItem) {
            return;
        }

        setIsAddingToCart(true);

        try {
            await cartApi.addToCart({ menuItemId: selectedItem.id, quantity, note });
            notifyCustomer({ message: "Thêm vào giỏ hàng thành công!", type: "success" });
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (error) {
            console.error("Failed to add item to cart:", error);
            notifyCustomer({ message: "Thêm vào giỏ hàng thất bại!", type: "error" });
        } finally {
            setIsAddingToCart(false);
            setSelectedItem(null);
        }
    };

    return (
        <>
            <Header activePage={"home"} />

            <div className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
                {sectionDots.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => handleDotClick(section.id)}
                            title={section.label}
                            aria-label={section.label}
                            className="group flex items-center justify-end cursor-pointer"
                        >
                            <span className={`block rounded-full transition-all duration-300 ${isActive ? "h-4 w-4 bg-[#e4c590] shadow-[0_0_0_4px_rgba(228,197,144,0.2)]" : "h-3 w-3 bg-white/45 group-hover:bg-[#e4c590]"}`} />
                        </button>
                    );
                })}
            </div>

            <section id="home-hero" className="h-screen w-7xl mx-auto -mt-20 flex items-center justify-between gap-6">
                <div data-aos="fade-right" data-aos-duration="900" className="text-white w-1/2 flex-1 flex flex-col gap-6">
                    <h1 className="text-5xl font-bold">Ca Dao Restaurant & Café</h1>
                    <p className="text-gray-300">Hơn 20 năm lan tỏa nét đẹp ẩm thực Việt, Ca Dao tự hào là nơi đầu tiên mang món Bún Huyền Mễ đến với thực khách trong và ngoài nước.
                        Mỗi món ăn tại Ca Dao là một “lời kể” về văn hóa, về con người Nam Bộ mộc mạc, chân chất.
                    </p>
                    <p className="text-gray-300">
                        Khám phá thực đơn đa dạng của chúng tôi, từ những món ăn truyền thống đậm đà hương vị đến những sáng tạo độc đáo, tất cả đều được chế biến từ những nguyên liệu tươi ngon nhất, mang đến trải nghiệm ẩm thực khó quên cho mọi thực khách.
                    </p>
                    <button
                        onClick={() => navigate("/menus")}
                        className="group relative overflow-hidden w-fit px-6 py-3 text-[#e4c590] border cursor-pointer"
                    >
                        <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 ease-in-out group-hover:scale-x-100"></span>
                        <span className="relative z-10 transition-colors duration-500 text-sm tracking-widest font-bold group-hover:text-black">CHỌN MÓN NGAY</span>
                    </button>
                </div>
                <div data-aos="fade-left" data-aos-duration="900" className="flex-1">
                    <img src="/spiner.png" alt="spiner" className="animate-[spin_180s_linear_infinite]" />
                </div>
            </section>

            <section id="home-featured" className="w-7xl mx-auto py-20">
                <div data-aos="fade-up" className="text-center mb-16">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Khám phá các món ăn được nhiều thực khách yêu thích nhất</p>
                    <h1 className="text-5xl font-bold mb-5 text-white">Món ăn nổi bật</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                {bestSellerItems.length > 0 ? (
                    <div className="grid gap-x-6 gap-y-28 md:grid-cols-2 lg:grid-cols-3 text-white">
                        {bestSellerItems.map((item, index) => (
                            <div key={item.id} data-aos="fade-up" data-aos-delay={index * 120} className="flex flex-col gap-6 p-6 bg-black/50 rounded-2xl border border-white/10">
                                <div className="h-50">
                                    {item.image_url ? (
                                        <img
                                            src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${item.image_url}`}
                                            alt={item.name}
                                            className="h-full mx-auto object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-gray-900">
                                            Chưa có hình ảnh
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col">
                                    <div className="text-center mb-3">
                                        <h3 className="text-xl font-semibold">{item.name}</h3>
                                        <span className="text-[#e4c590] font-bold">
                                            {Number(item.price || 0).toLocaleString("vi-VN")}đ
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 text-xs mb-3">
                                        <span className="text-gray-500">Đã bán: {Number(item.sold_count || 0)}</span>
                                        {item.avg_rating > 0 &&
                                            <span className="text-amber-300 font-semibold">★ {Number(item.avg_rating).toFixed(1)}/5</span>
                                        }
                                    </div>

                                    <p className="text-gray-400 text-sm leading-relaxed mb-4 min-h-20 text-center">
                                        {item.description || "Món ăn được thực khách lựa chọn nhiều nhất tại Ca Dao."}
                                    </p>

                                    <div className="mt-auto flex justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenAddToCart(item)}
                                            disabled={isAddingToCart && selectedItem?.id === item.id}
                                            className="group relative overflow-hidden px-5 py-2.5 border border-[#e4c590] text-[#e4c590] cursor-pointer"
                                        >
                                            <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 ease-in-out group-hover:scale-x-100"></span>
                                            <span className="relative z-10 text-sm font-bold tracking-wider transition-colors duration-500 group-hover:text-black">
                                                THÊM VÀO GIỎ
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 rounded-2xl border border-white/10 bg-black/30 p-8">
                        Chưa có dữ liệu món bán chạy.
                    </div>
                )}
            </section>

            <section id="home-why" className="w-7xl mx-auto py-20">
                <div data-aos="fade-up" className="text-center mb-16">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Chúng tôi luôn đặt chất lượng và trải nghiệm của bạn lên hàng đầu</p>
                    <h1 className="text-5xl font-bold mb-5 text-white">Vì sao nên chọn chúng tôi?</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                <div className="flex gap-6 text-white">
                    <div data-aos="fade-up" data-aos-delay="0" className="flex-1 flex flex-col items-center justify-between text-center gap-6 bg-black/50 p-6 rounded-2xl border border-white/10">
                        <img src="/whychooseus1.png" alt="" />
                        <h3 className="text-xl font-semibold">Thực phẩm đảm bảo vệ sinh</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Chúng tôi lựa chọn nguyên liệu tươi mỗi ngày từ nguồn cung uy tín và chế biến trong môi trường sạch sẽ.
                            Mọi khâu đều tuân thủ tiêu chuẩn an toàn thực phẩm, giúp bạn yên tâm thưởng thức.
                        </p>
                    </div>

                    <div data-aos="fade-up" data-aos-delay="150" className="flex-1 flex flex-col items-center justify-between text-center gap-6 bg-black/50 p-6 rounded-2xl border border-white/10">
                        <img src="/whychooseus2.png" alt="" />
                        <h3 className="text-xl font-semibold">Đầu bếp giàu kinh nghiệm</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Đội ngũ đầu bếp nhiều năm kinh nghiệm, am hiểu hương vị và kỹ thuật chế biến. Mỗi món ăn được chăm chút kỹ
                            lưỡng từ nêm nếm đến trình bày, mang đến trải nghiệm ẩm thực ổn định và trọn vẹn.
                        </p>
                    </div>

                    <div data-aos="fade-up" data-aos-delay="300" className="flex-1 flex flex-col items-center justify-between text-center gap-6 bg-black/50 p-6 rounded-2xl border border-white/10">
                        <img src="/whychooseus3.png" alt="" />
                        <h3 className="text-xl font-semibold">Phục vụ nhanh chóng</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Đội ngũ nhân viên làm việc linh hoạt, phối hợp nhịp nhàng từ khâu tiếp nhận đến khâu giao hàng. Mọi thao
                            tác đều được thực hiện nhanh gọn, chính xác, giúp bạn nhận món trong thời gian sớm nhất.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={() => navigate("/about")}
                        data-aos="fade-up"
                        className="group relative overflow-hidden w-fit px-6 py-3 mt-16 text-[#e4c590] border cursor-pointer"
                    >
                        <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 ease-in-out group-hover:scale-x-100"></span>
                        <span className="relative z-10 transition-colors duration-500 text-sm tracking-widest font-bold group-hover:text-black">XEM CÂU CHUYỆN</span>
                    </button>
                </div>
            </section>

            {reviews.length > 0 && (
                <section id="home-reviews" className="w-7xl mx-auto py-20">
                    <div data-aos="fade-up" className="text-center mb-16">
                        <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Những đánh giá nổi bật từ khách hàng đã dùng dịch vụ của Ca Dao</p>
                        <h1 className="text-5xl font-bold mb-5 text-white">Khách hàng nói gì về chúng tôi?</h1>
                        <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                    </div>

                    <div data-aos="fade-up" data-aos-delay="100" className="relative">
                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-1300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                style={{ transform: `translateX(-${activeReview * 100}%)` }}
                            >
                                {reviews.map((review) => (
                                    <div key={review.id} className="w-full shrink-0">
                                        <div className="flex w-5xl mx-auto overflow-hidden bg-black/50 rounded-2xl border border-white/10">
                                            <img
                                                src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${review.customer_avatar}`}
                                                alt={review.customer_name}
                                                className="h-80 object-cover"
                                            />
                                            <div className="flex flex-col gap-3 p-6">
                                                <StarRow rating={Number(review.rating)} />
                                                <p className="leading-relaxed font-medium text-gray-300 text-lg">{review.content}</p>
                                                <p className="font-bold text-white text-lg">- {review.customer_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {reviews.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveReview((prev) => (prev - 1 + reviews.length) % reviews.length)}
                                    className="absolute top-1/2 left-0 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/20 bg-black/40 text-white hover:border-[#e4c590] hover:text-[#e4c590] transition-colors cursor-pointer"
                                >
                                    ‹
                                </button>
                                <button
                                    onClick={() => setActiveReview((prev) => (prev + 1) % reviews.length)}
                                    className="absolute top-1/2 right-0 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/20 bg-black/40 text-white hover:border-[#e4c590] hover:text-[#e4c590] transition-colors cursor-pointer"
                                >
                                    ›
                                </button>
                            </>
                        )}

                        {reviews.length > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {reviews.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveReview(i)}
                                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === activeReview ? "w-6 bg-[#e4c590]" : "w-2 bg-white/30 hover:bg-white/50"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => navigate("/contact")}
                            data-aos="fade-up"
                            className="group relative overflow-hidden w-fit px-6 py-3 mt-16 text-[#e4c590] border cursor-pointer"
                        >
                            <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 ease-in-out group-hover:scale-x-100"></span>
                            <span className="relative z-10 transition-colors duration-500 text-sm tracking-widest font-bold group-hover:text-black">ĐẶT BÀN NGAY</span>
                        </button>
                    </div>
                </section>
            )}

            <Footer />

            <AddToCartModal
                item={selectedItem}
                isOpen={Boolean(selectedItem)}
                onClose={() => setSelectedItem(null)}
                onSubmit={handleAddToCart}
            />
        </>
    );
}

export default HomePage