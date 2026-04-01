import { useEffect, useState } from "react";
import AOS from "aos";

import Footer from "../../components/customer/Footer";
import Header from "../../components/customer/Header";
import promotionApi from "../../api/promotionApi";
import voucherApi from "../../api/voucherApi";

const PromotionPage = () => {
    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    const [promotions, setPromotions] = useState([]);
    const [vouchers, setVouchers] = useState([]);

    const fetchPromotions = async () => {
        try {
            const response = await promotionApi.getAll();
            setPromotions(response.data);
        } catch (error) {
            console.error("Error fetching promotions:", error);
        }
    };

    const fetchVouchers = async () => {
        try {
            const response = await voucherApi.getVouchers();
            setVouchers(response.data.data);
        } catch (error) {
            console.error("Error fetching vouchers:", error);
        }
    };

    useEffect(() => {
        fetchPromotions();
        fetchVouchers();
    }, []);

    const now = new Date();
    const activePromotions = promotions.filter(p =>
        p.is_active && new Date(p.start_time) <= now && new Date(p.end_time) >= now
    );
    const upcomingPromotions = promotions.filter(p =>
        p.is_active && new Date(p.start_time) > now
    );

    const getScopeText = (promo) => {
        const parts = [];
        if (promo.menu_types && promo.menu_types.length > 0)
            parts.push(...promo.menu_types.map(t => t.name));
        if (promo.categories && promo.categories.length > 0)
            parts.push(...promo.categories.map(c => c.name));
        if (promo.menu_items && promo.menu_items.length > 0)
            parts.push(...promo.menu_items.map(m => m.name));
        return parts.length > 0 ? parts.join(", ") : "Tất cả";
    };

    const getDiscountText = (promo) => {
        if (promo.discount_percent) return `${promo.discount_percent}%`;
        if (promo.discount_amount) return `${Number(promo.discount_amount).toLocaleString('vi-VN')}đ`;
        return "";
    };

    return (
        <div>
            <Header activePage={"promotions"} />

            <div className="w-7xl mx-auto py-10 text-white">
                <div data-aos="fade-up" className="text-center mb-8">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Theo dõi các khuyến mãi đang diễn ra</p>
                    <h1 className="text-5xl font-bold mb-5">Chương trình khuyến mãi</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                <div>
                    {/* Khuyến mãi đang diễn ra */}
                    {activePromotions.length > 0 && (
                        <div data-aos="fade-right" className="mb-16">
                            <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                                Đang diễn ra
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {activePromotions.map(promo => (
                                    <div key={promo.id} className="p-6 border border-white/10 rounded-xl bg-black/30 hover:bg-black/40 transition">
                                        <div className="flex items-start justify-between mb-3">
                                            <h2 className="text-xl font-bold text-[#e4c590]">{promo.name}</h2>
                                            <span className="shrink-0 ml-3 bg-[#e4c590]/20 text-[#e4c590] px-3 py-1 rounded-full text-sm font-bold">
                                                -{getDiscountText(promo)}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 mb-4 text-sm">{promo.description}</p>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {promo.menu_types?.map(t => (
                                                <span key={`mt-${t.id}`} className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">{t.name}</span>
                                            ))}
                                            {promo.categories?.map(c => (
                                                <span key={`cat-${c.id}`} className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full text-xs">{c.name}</span>
                                            ))}
                                            {promo.menu_items?.map(m => (
                                                <span key={`mi-${m.id}`} className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-xs">{m.name}</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {new Date(promo.start_time).toLocaleDateString('vi-VN')} — {new Date(promo.end_time).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Khuyến mãi sắp diễn ra */}
                    {upcomingPromotions.length > 0 && (
                        <div data-aos="fade-right" className="mb-16">
                            <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                                Sắp diễn ra
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {upcomingPromotions.map(promo => (
                                    <div key={promo.id} className="p-6 border border-white/10 rounded-xl bg-black/20 opacity-80">
                                        <div className="flex items-start justify-between mb-3">
                                            <h2 className="text-xl font-bold text-white/80">{promo.name}</h2>
                                            <span className="shrink-0 ml-3 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-bold">
                                                -{getDiscountText(promo)}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 mb-4 text-sm">{promo.description}</p>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {promo.menu_types?.map(t => (
                                                <span key={`mt-${t.id}`} className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-xs">{t.name}</span>
                                            ))}
                                            {promo.categories?.map(c => (
                                                <span key={`cat-${c.id}`} className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full text-xs">{c.name}</span>
                                            ))}
                                            {promo.menu_items?.map(m => (
                                                <span key={`mi-${m.id}`} className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-xs">{m.name}</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Bắt đầu từ {new Date(promo.start_time).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activePromotions.length === 0 && upcomingPromotions.length === 0 && (
                        <div data-aos="fade-up" className="text-center py-12 text-gray-400">
                            Hiện tại chưa có chương trình khuyến mãi nào.
                        </div>
                    )}

                    {/* Voucher */}
                    {vouchers.length > 0 && (
                        <div data-aos="fade-right">
                            <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-[#e4c590]"></span>
                                Mã giảm giá
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {vouchers.map(voucher => (
                                    voucher.is_active && (
                                        <div key={voucher.id} className="p-5 border border-white/10 rounded-xl bg-black/30 hover:bg-black/40 transition">
                                            <div className="flex items-center justify-between mb-3">
                                                <h2 className="text-lg font-bold text-[#e4c590] tracking-wide">{voucher.code}</h2>
                                                <span className="bg-[#e4c590]/20 text-[#e4c590] px-2 py-0.5 rounded text-xs font-bold">
                                                    {voucher.discount_percent ? `-${voucher.discount_percent}%` : `-${Number(voucher.discount_amount).toLocaleString('vi-VN')}đ`}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 text-sm mb-3">
                                                Đơn tối thiểu {Number(voucher.min_order_value).toLocaleString('vi-VN')}đ
                                                {voucher.max_discount ? ` · Giảm tối đa ${Number(voucher.max_discount).toLocaleString('vi-VN')}đ` : ""}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>HSD: {new Date(voucher.expiry_date).toLocaleDateString('vi-VN')}</span>
                                                <span>{voucher.used_count}/{voucher.usage_limit || "∞"} đã dùng</span>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default PromotionPage;