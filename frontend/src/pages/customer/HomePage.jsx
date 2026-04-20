import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";

import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";
import reviewApi from "../../api/reviewApi";
import menuApi from "../../api/menuApi";
import cartApi from "../../api/cartApi";
import promotionApi from "../../api/promotionApi";
import { buildPromotionMap } from "../../utils/promotionUtils";
import AddToCartModal from "../../components/customer/AddToCartModal";
import { notifyCustomer } from "../../utils/customerNotify";
import { formatDateDDMMYYYY } from "../../functions/formatDate";

const StarRow = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`text-lg ${s <= rating ? "text-yellow-500" : "text-gray-600"}`}>★</span>
        ))}
    </div>
);

const HomePage = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewTotalPages, setReviewTotalPages] = useState(1);
    const [bestSellerItems, setBestSellerItems] = useState([]);
    const [promotionMap, setPromotionMap] = useState({});
    const [featuredPromotions, setFeaturedPromotions] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
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
        { id: "home-why", label: "Vì sao chọn CD" },
        ...(featuredPromotions.length > 0 ? [{ id: "home-promos", label: "Khuyến mãi" }] : []),
        ...(reviews.length > 0 || reviewPage > 1 ? [{ id: "home-reviews", label: "Đánh giá" }] : [])
    ], [reviews.length, reviewPage, featuredPromotions.length]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await reviewApi.getFeaturedReviews({ page: reviewPage, limit: 3 });
                setReviews(res.data?.data || []);
                setReviewTotalPages(res.data?.pagination?.totalPages || 1);
            } catch {
                setReviews([]);
            } finally {
                AOS.refresh();
            }
        };

        fetchReviews();
    }, [reviewPage]);

    useEffect(() => {
        menuApi.getFeatured()
            .then((res) => { setBestSellerItems(res.data || []); AOS.refresh(); })
            .catch(() => setBestSellerItems([]));

        promotionApi.getAll({ status: 'active', limit: 3 })
            .then((res) => {
                setFeaturedPromotions(res.data.data || []);
            })
            .catch(() => setFeaturedPromotions([]));
    }, []);

    useEffect(() => {
        if (bestSellerItems.length === 0) { setPromotionMap({}); return; }
        const itemIds = bestSellerItems.map(item => item.id);
        promotionApi.getActiveForItems(itemIds)
            .then(res => {
                const priceMap = Object.fromEntries(bestSellerItems.map(i => [i.id, Number(i.price)]));
                setPromotionMap(buildPromotionMap(res.data, priceMap));
            })
            .catch(() => setPromotionMap({}));
    }, [bestSellerItems]);

    useEffect(() => {
        const clearSnapTimer = () => {
            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
                snapTimerRef.current = null;
            }
        };

        const detectActiveSection = () => {
            const focusLine = window.innerHeight * 0.32;
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

            <section id="home-hero" className="h-screen w-7xl mx-auto -mt-20 flex items-center justify-between gap-12">
                <div data-aos="fade-right" data-aos-duration="900" className="text-white flex-4 flex flex-col gap-6">
                    <h1 className="text-5xl font-bold">CD Restaurant & Café</h1>
                    <p className="text-gray-300">Hơn 20 năm lan tỏa nét đẹp ẩm thực Việt, CD tự hào là nơi đầu tiên mang món Bún Huyền Mễ đến với thực khách trong và ngoài nước.
                        Mỗi món ăn tại CD là một “lời kể” về văn hóa, về con người Nam Bộ mộc mạc, chân chất.
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
                <div data-aos="fade-left" data-aos-duration="900" className="flex-3">
                    <img src="/spiner.png" alt="spiner" className="animate-[spin_180s_linear_infinite]" />
                </div>
            </section>

            <section id="home-featured" className="w-7xl mx-auto py-20">
                <div data-aos="fade-up" className="text-center mb-8">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Khám phá các món ăn được nhiều thực khách yêu thích nhất</p>
                    <h1 className="text-5xl font-bold mb-5 text-white">Món ăn nổi bật</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                {bestSellerItems.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-6 text-white">
                        {bestSellerItems.map((item, index) => (
                            <div key={item.id} data-aos="fade-up" data-aos-delay={(index % 3) * 100} className="relative flex flex-col gap-6 p-6 bg-black/50 rounded-2xl border border-white/10 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                                {promotionMap[item.id] && (
                                    <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                        -{promotionMap[item.id].discount_percent ? `${promotionMap[item.id].discount_percent}%` : `${Number(promotionMap[item.id].discount_amount).toLocaleString('vi-VN')}đ`}
                                    </span>
                                )}
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
                                        {(() => {
                                            const promo = promotionMap[item.id];
                                            if (promo) {
                                                const original = Number(item.price || 0);
                                                const discounted = promo.discount_percent
                                                    ? Math.round(original * (1 - promo.discount_percent / 100))
                                                    : Math.max(0, original - Number(promo.discount_amount));
                                                return (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="text-gray-500 line-through text-sm">{original.toLocaleString('vi-VN')}đ</span>
                                                        <span className="text-[#e4c590] font-bold">{discounted.toLocaleString('vi-VN')}đ</span>
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span className="text-[#e4c590] font-bold">
                                                    {Number(item.price || 0).toLocaleString('vi-VN')}đ
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    <div className="flex items-center justify-center gap-3 text-xs mb-3">
                                        <span className="text-gray-500">Đã bán: {Number(item.sold_count || 0)}</span>
                                        {item.avg_rating > 0 &&
                                            <span className="text-amber-300 font-semibold">★ {Number(item.avg_rating).toFixed(1)}/5</span>
                                        }
                                    </div>

                                    <p className="text-gray-400 text-sm leading-relaxed mb-4 min-h-20 text-center">
                                        {item.description || "Món ăn được thực khách lựa chọn nhiều nhất tại CD."}
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
                <div data-aos="fade-up" className="text-center mb-8">
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

            {featuredPromotions.length > 0 && (
                <section id="home-promos" className="w-7xl mx-auto py-20">
                    <div data-aos="fade-up" className="text-center mb-8">
                        <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Đừng bỏ lỡ những ưu đãi hấp dẫn đang chờ bạn</p>
                        <h1 className="text-5xl font-bold mb-5 text-white">Khuyến mãi nổi bật</h1>
                        <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-white">
                        {featuredPromotions.map((promo, index) => (
                            <div
                                key={promo.id}
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                                className="group rounded-2xl border border-white/10 bg-black/50 overflow-hidden hover:border-[#e4c590]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(228,197,144,0.08)] w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                            >
                                {promo.image_url ? (
                                    <div className="h-44 overflow-hidden">
                                        <img
                                            src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${promo.image_url}`}
                                            alt={promo.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-44 bg-gradient-to-br from-[#e4c590]/20 to-transparent flex items-center justify-center">
                                        <span className="text-4xl font-black text-[#e4c590]">
                                            -{promo.discount_percent ? `${promo.discount_percent}%` : `${Number(promo.discount_amount).toLocaleString('vi-VN')}đ`}
                                        </span>
                                    </div>
                                )}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-bold text-[#e4c590] line-clamp-1">{promo.name}</h3>
                                        <span className="shrink-0 ml-2 bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                            -{promo.discount_percent ? `${promo.discount_percent}%` : `${Number(promo.discount_amount).toLocaleString('vi-VN')}đ`}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{promo.description}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(promo.start_time).toLocaleDateString('vi-VN')} — {new Date(promo.end_time).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => navigate("/promotions")}
                            data-aos="fade-up"
                            className="group relative overflow-hidden w-fit px-6 py-3 mt-16 text-[#e4c590] border cursor-pointer"
                        >
                            <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 ease-in-out group-hover:scale-x-100"></span>
                            <span className="relative z-10 transition-colors duration-500 text-sm tracking-widest font-bold group-hover:text-black">XEM TẤT CẢ KHUYẾN MÃI</span>
                        </button>
                    </div>
                </section>
            )}

            {(reviews.length > 0 || reviewPage > 1) && (
                <section id="home-reviews" className="w-7xl mx-auto py-20">
                    <div data-aos="fade-up" className="text-center mb-8">
                        <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Những đánh giá nổi bật từ khách hàng đã dùng dịch vụ của CD</p>
                        <h1 className="text-5xl font-bold mb-5 text-white">Khách hàng nói gì về chúng tôi?</h1>
                        <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-white">
                        {reviews.map((review, index) => (
                            <div key={review.id} data-aos="fade-up" data-aos-delay={(index % 3) * 100} className="p-6 bg-black/50 rounded-2xl border border-white/10 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                                <div className="flex items-center gap-4 mb-4">
                                    <img
                                        src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${review.customer_avatar}`}
                                        alt={review.customer_name}
                                        className="h-15 w-15 object-cover rounded-full"
                                    />
                                    <div>
                                        <p className="text-lg">{review.customer_name}</p>
                                        <p className="text-sm text-slate-400">{formatDateDDMMYYYY(review.created_at)}</p>
                                    </div>
                                </div>
                                <StarRow rating={Number(review.rating)} />
                                <p className="mt-2 text-gray-400 text-sm leading-relaxed">{review.content}</p>
                            </div>
                        ))}
                    </div>

                    {reviewTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                                disabled={reviewPage <= 1}
                                className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 text-white hover:border-[#e4c590] hover:text-[#e4c590] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                ‹
                            </button>

                            {Array.from({ length: reviewTotalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setReviewPage(p)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-colors cursor-pointer ${p === reviewPage ? "bg-[#e4c590] text-black" : "border border-white/20 text-white hover:border-[#e4c590] hover:text-[#e4c590]"}`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                                disabled={reviewPage >= reviewTotalPages}
                                className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 text-white hover:border-[#e4c590] hover:text-[#e4c590] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                ›
                            </button>
                        </div>
                    )}

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