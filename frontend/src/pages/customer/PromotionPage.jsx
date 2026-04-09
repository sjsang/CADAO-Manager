import { useEffect, useState } from "react";
import AOS from "aos";

import Footer from "../../components/customer/Footer";
import Header from "../../components/customer/Header";
import promotionApi from "../../api/promotionApi";
import voucherApi from "../../api/voucherApi";

const CLOUDINARY_BASE = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/`;

const PromotionPage = () => {
    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    const [promotions, setPromotions] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    const fetchPromotions = async () => {
        try {
            const response = await promotionApi.getAll({ limit: 200 });
            setPromotions(response.data.data);
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
    const activeVouchers = vouchers.filter(v => v.is_active);

    const getScopeText = (promo) => {
        const parts = [];
        if (promo.menu_types?.length > 0) parts.push(...promo.menu_types.map(t => t.name));
        if (promo.categories?.length > 0) parts.push(...promo.categories.map(c => c.name));
        if (promo.menu_items?.length > 0) parts.push(...promo.menu_items.map(m => m.name));
        return parts.length > 0 ? parts.join(", ") : "Tất cả món";
    };

    const getDiscountText = (item) => {
        if (item.discount_percent) return `${item.discount_percent}%`;
        if (item.discount_amount) return `${Number(item.discount_amount).toLocaleString('vi-VN')}đ`;
        return "";
    };

    const getRankText = (rank) => {
        if (rank === 'loyal') return 'Khách hàng thân quen';
        if (rank === 'normal') return 'Khách hàng mới';
        return 'Tất cả khách hàng';
    };

    return (
        <div>
            <Header activePage={"promotions"} />

            <div className="w-7xl mx-auto py-10 text-white">
                <div data-aos="fade-up" className="text-center mb-12">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Ưu đãi hấp dẫn dành riêng cho bạn</p>
                    <h1 className="text-5xl font-bold mb-5">Khuyến mãi & Voucher</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                {/* Khuyến mãi đang diễn ra */}
                {activePromotions.length > 0 && (
                    <div data-aos="fade-right" className="mb-16">
                        <div className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Đang diễn ra
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activePromotions.map(promo => (
                                <div
                                    key={promo.id}
                                    onClick={() => setSelectedPromo(promo)}
                                    className="group cursor-pointer rounded-2xl border border-white/10 bg-black/30 overflow-hidden hover:border-[#e4c590]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(228,197,144,0.08)]"
                                >
                                    {promo.image_url ? (
                                        <div className="h-44 overflow-hidden">
                                            <img
                                                src={`${CLOUDINARY_BASE}${promo.image_url}`}
                                                alt={promo.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-44 bg-gradient-to-br from-[#e4c590]/20 to-transparent flex items-center justify-center">
                                            <span className="text-4xl font-black text-[#e4c590]">-{getDiscountText(promo)}</span>
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-2">
                                            <h2 className="text-lg font-bold text-[#e4c590] line-clamp-1">{promo.name}</h2>
                                            <span className="shrink-0 ml-2 bg-[#e4c590]/20 text-[#e4c590] px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                -{getDiscountText(promo)}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{promo.description}</p>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {promo.menu_types?.slice(0, 2).map(t => (
                                                <span key={`mt-${t.id}`} className="bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full text-xs">{t.name}</span>
                                            ))}
                                            {promo.categories?.slice(0, 2).map(c => (
                                                <span key={`cat-${c.id}`} className="bg-green-500/15 text-green-300 px-2 py-0.5 rounded-full text-xs">{c.name}</span>
                                            ))}
                                            {promo.menu_items?.slice(0, 2).map(m => (
                                                <span key={`mi-${m.id}`} className="bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full text-xs">{m.name}</span>
                                            ))}
                                            {((promo.menu_types?.length || 0) + (promo.categories?.length || 0) + (promo.menu_items?.length || 0)) === 0 && (
                                                <span className="bg-[#e4c590]/15 text-[#e4c590] px-2 py-0.5 rounded-full text-xs">Tất cả món</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {new Date(promo.start_time).toLocaleDateString('vi-VN')} — {new Date(promo.end_time).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Khuyến mãi sắp diễn ra */}
                {upcomingPromotions.length > 0 && (
                    <div data-aos="fade-right" className="mb-16">
                        <div className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                            Sắp diễn ra
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingPromotions.map(promo => (
                                <div
                                    key={promo.id}
                                    onClick={() => setSelectedPromo(promo)}
                                    className="group cursor-pointer rounded-2xl border border-white/10 bg-black/20 overflow-hidden opacity-80 hover:opacity-100 hover:border-blue-500/30 transition-all duration-300"
                                >
                                    {promo.image_url ? (
                                        <div className="h-44 overflow-hidden">
                                            <img
                                                src={`${CLOUDINARY_BASE}${promo.image_url}`}
                                                alt={promo.name}
                                                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-44 bg-gradient-to-br from-blue-500/15 to-transparent flex items-center justify-center">
                                            <span className="text-4xl font-black text-blue-300">-{getDiscountText(promo)}</span>
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <h2 className="text-lg font-bold text-white/80 mb-2 line-clamp-1">{promo.name}</h2>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{promo.description}</p>
                                        <p className="text-xs text-gray-500">
                                            Bắt đầu từ {new Date(promo.start_time).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activePromotions.length === 0 && upcomingPromotions.length === 0 && (
                    <div data-aos="fade-up" className="text-center py-12 text-gray-400 mb-12">
                        Hiện tại chưa có chương trình khuyến mãi nào.
                    </div>
                )}

                {/* Voucher */}
                {activeVouchers.length > 0 && (
                    <div data-aos="fade-right">
                        <div className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-[#e4c590]"></span>
                            Mã giảm giá
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {activeVouchers.map(voucher => (
                                <div
                                    key={voucher.id}
                                    onClick={() => setSelectedVoucher(voucher)}
                                    className="cursor-pointer flex rounded-2xl border border-white/10 bg-black/30 overflow-hidden hover:border-[#e4c590]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(228,197,144,0.06)]"
                                >
                                    {/* Bên trái: giá trị to */}
                                    <div className="w-32 shrink-0 bg-gradient-to-br from-[#e4c590]/25 to-[#e4c590]/5 flex flex-col items-center justify-center border-r border-dashed border-white/10 p-3">
                                        <span className="text-3xl font-black text-[#e4c590] leading-tight">
                                            {voucher.discount_percent ? `${voucher.discount_percent}%` : `${Math.round(Number(voucher.discount_amount) / 1000)}K`}
                                        </span>
                                        <span className="text-[10px] text-[#e4c590]/70 uppercase tracking-wider mt-1">giảm</span>
                                    </div>
                                    {/* Bên phải: thông tin */}
                                    <div className="flex-1 p-4 flex flex-col justify-between">
                                        <div>
                                            <h2 className="text-base font-bold text-[#e4c590] tracking-wider mb-1">{voucher.code}</h2>
                                            <p className="text-gray-400 text-xs">
                                                Đơn tối thiểu {Number(voucher.min_order_value).toLocaleString('vi-VN')}đ
                                                {voucher.max_discount ? ` · Tối đa ${Number(voucher.max_discount).toLocaleString('vi-VN')}đ` : ""}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                                            <span>HSD: {voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                                            <span>{voucher.used_count}/{voucher.usage_limit || "∞"}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal chi tiết khuyến mãi */}
            {selectedPromo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedPromo(null)}>
                    <div className="relative w-xl mx-4 max-h-[85vh] overflow-y-auto rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        {selectedPromo.image_url && (
                            <div className="overflow-hidden rounded-t-2xl">
                                <img src={`${CLOUDINARY_BASE}${selectedPromo.image_url}`} alt={selectedPromo.name} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <button onClick={() => setSelectedPromo(null)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition cursor-pointer">✕</button>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <h2 className="text-2xl font-bold text-[#e4c590]">{selectedPromo.name}</h2>
                                <span className="shrink-0 ml-3 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                                    -{getDiscountText(selectedPromo)}
                                </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-5 leading-relaxed">{selectedPromo.description}</p>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="text-[#e4c590]">⏰</span>
                                    <span>{new Date(selectedPromo.start_time).toLocaleDateString('vi-VN')} — {new Date(selectedPromo.end_time).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-400">
                                    <span className="text-[#e4c590]">🍽️</span>
                                    <span>Áp dụng cho: {getScopeText(selectedPromo)}</span>
                                </div>
                                {selectedPromo.applicable_rank && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span className="text-[#e4c590]">👑</span>
                                        <span>Dành cho: {getRankText(selectedPromo.applicable_rank)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Scope tags */}
                            <div className="flex flex-wrap gap-2 mt-5">
                                {selectedPromo.menu_types?.map(t => (
                                    <span key={`mt-${t.id}`} className="bg-blue-500/15 text-blue-300 px-2.5 py-1 rounded-full text-xs">{t.name}</span>
                                ))}
                                {selectedPromo.categories?.map(c => (
                                    <span key={`cat-${c.id}`} className="bg-green-500/15 text-green-300 px-2.5 py-1 rounded-full text-xs">{c.name}</span>
                                ))}
                                {selectedPromo.menu_items?.map(m => (
                                    <span key={`mi-${m.id}`} className="bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-full text-xs">{m.name}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chi tiết voucher */}
            {selectedVoucher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedVoucher(null)}>
                    <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Phần trên: giá trị voucher to */}
                        <div className="bg-gradient-to-br from-[#e4c590]/25 to-[#e4c590]/5 py-10 text-center">
                            <span className="text-6xl font-black text-[#e4c590]">
                                {selectedVoucher.discount_percent ? `-${selectedVoucher.discount_percent}%` : `-${Number(selectedVoucher.discount_amount).toLocaleString('vi-VN')}đ`}
                            </span>
                            <p className="text-[#e4c590]/60 text-sm mt-2 uppercase tracking-widest">Giảm giá</p>
                        </div>
                        <button onClick={() => setSelectedVoucher(null)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition cursor-pointer">✕</button>
                        {/* Đường cắt voucher */}
                        <div className="relative">
                            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#0f0f1a]"></div>
                            <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#0f0f1a]"></div>
                            <div className="border-t border-dashed border-white/10"></div>
                        </div>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-[#e4c590] tracking-wider text-center mb-5">{selectedVoucher.code}</h2>
                            <div className="space-y-3 text-sm text-gray-400">
                                <div className="flex justify-between">
                                    <span>Đơn tối thiểu</span>
                                    <span className="text-white font-medium">{Number(selectedVoucher.min_order_value).toLocaleString('vi-VN')}đ</span>
                                </div>
                                {selectedVoucher.max_discount && (
                                    <div className="flex justify-between">
                                        <span>Giảm tối đa</span>
                                        <span className="text-white font-medium">{Number(selectedVoucher.max_discount).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Hạn sử dụng</span>
                                    <span className="text-white font-medium">{selectedVoucher.expiry_date ? new Date(selectedVoucher.expiry_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Đã sử dụng</span>
                                    <span className="text-white font-medium">{selectedVoucher.used_count}/{selectedVoucher.usage_limit || "∞"}</span>
                                </div>
                                {selectedVoucher.applicable_rank && selectedVoucher.applicable_rank !== 'all' && (
                                    <div className="flex justify-between">
                                        <span>Dành cho</span>
                                        <span className="text-[#e4c590] font-medium">{getRankText(selectedVoucher.applicable_rank)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default PromotionPage;