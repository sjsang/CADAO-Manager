import Header from "../../components/customer/Header";
import AOS from "aos";
import CustomerConfirmModal from "../../components/customer/CustomerConfirmModal";
import orderApi from "../../api/orderApi";
import cartApi from "../../api/cartApi";
import customerApi from "../../api/customerApi";
import wardApi from "../../api/wardApi";
import voucherApi from "../../api/voucherApi";
import promotionApi from "../../api/promotionApi";
import { buildPromotionMap } from "../../utils/promotionUtils";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { notifyCustomer } from "../../utils/customerNotify";

const deliveryPhoneRegex = /^(0|\+84)\d{9,10}$/;

const CheckoutPage = () => {
    const { orderCode } = useParams();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherMessage, setVoucherMessage] = useState("");
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transferQrOrder, setTransferQrOrder] = useState(null);
    const isMountedRef = useRef(true);
    const [promotionMap, setPromotionMap] = useState({});
    const [promotionDiscount, setPromotionDiscount] = useState(0);
    const [estimatedDelivery, setEstimatedDelivery] = useState(null);
    const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
    const [form, setForm] = useState({
        delivery_full_name: "",
        delivery_phone: "",
        delivery_address: "",
        delivery_ward_name: "",
        notes: "",
        paymentMethod: "cash"
    });

    const loadAddresses = async () => {
        const addressRes = await customerApi.getAddresses();
        const addrs = addressRes.data.data || [];
        setAddresses(addrs);
        setSelectedAddressId((prev) => {
            if (!prev) return prev;
            return addrs.some((addr) => addr.id === prev) ? prev : null;
        });
        return addrs;
    };

    const loadWards = async () => {
        const response = await wardApi.getWards({
            page: 1,
            limit: 100,
            sortBy: "name",
            sortDir: "asc"
        });
        const wardList = response.data.data || response.data || [];
        setWards(wardList);
        return wardList;
    };

    const fetchPrediction = useCallback(async (wardName, items) => {
        if (!wardName || !items || items.length === 0) {
            setEstimatedDelivery(null);
            return;
        }
        setIsLoadingPrediction(true);
        try {
            const totalItems = items.reduce((s, i) => s + Number(i.quantity), 0);
            const numDistinct = items.length;
            const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);

            const res = await orderApi.predictDelivery({
                ward_name: wardName,
                total_items: totalItems,
                num_distinct: numDistinct,
                subtotal
            });
            if (res.data?.data?.estimated_minutes) {
                setEstimatedDelivery(res.data.data);
            } else {
                setEstimatedDelivery(null);
            }
        } catch {
            setEstimatedDelivery(null);
        } finally {
            setIsLoadingPrediction(false);
        }
    }, []);

    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orderRes, addrs] = await Promise.all([
                    orderApi.getByOrderCode(orderCode),
                    loadAddresses(),
                    loadWards()
                ]);
                const order = orderRes.data.data;
                setOrderDetails(order);
                setShippingFee(Number(order.shipping_fee || 0));
                setVoucherCode(order.voucher_code || "");
                setAppliedVoucher(order.voucher_id ? { id: order.voucher_id, code: order.voucher_code || "" } : null);

                // Lấy khuyến mãi cho các món trong đơn
                if (order.items && order.items.length > 0) {
                    const itemIds = order.items.map(item => item.menu_item_id);
                    try {
                        const promoRes = await promotionApi.getActiveForItems(itemIds);
                        const priceMap = Object.fromEntries(order.items.map(i => [i.menu_item_id, Number(i.price)]));
                        const pMap = buildPromotionMap(promoRes.data, priceMap);
                        let totalPromoDiscount = 0;
                        for (const item of order.items) {
                            const promo = pMap[item.menu_item_id];
                            if (promo) {
                                const itemTotal = Number(item.price) * Number(item.quantity);
                                if (promo.discount_percent) {
                                    totalPromoDiscount += Math.round(itemTotal * Number(promo.discount_percent) / 100);
                                } else if (promo.discount_amount) {
                                    totalPromoDiscount += Math.min(Number(promo.discount_amount) * Number(item.quantity), itemTotal);
                                }
                            }
                        }
                        setPromotionMap(pMap);
                        setPromotionDiscount(totalPromoDiscount);
                    } catch (e) {
                        console.error("Failed to fetch promotions:", e);
                    }
                }
                setForm({
                    delivery_full_name: order.delivery_full_name,
                    delivery_phone: order.delivery_phone,
                    delivery_address: order.delivery_address || "",
                    delivery_ward_name: order.delivery_ward_name || "",
                    notes: order.notes || "",
                    paymentMethod: "cash"
                });
                const matched = addrs.find(
                    a => a.address_line === order.delivery_address && a.ward_name === order.delivery_ward_name
                );
                if (matched) {
                    setSelectedAddressId(matched.id);
                    fetchPrediction(matched.ward_name, order.items);
                }
                AOS.refresh();
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, [orderCode]);

    useEffect(() => {
        const handleAddressUpdated = async () => {
            try {
                await loadAddresses();
            } catch (error) {
                console.error("Failed to refresh addresses:", error);
            }
        };

        window.addEventListener("customerAddressUpdated", handleAddressUpdated);
        return () => window.removeEventListener("customerAddressUpdated", handleAddressUpdated);
    }, []);

    const handleAddressSelect = (addr) => {
        setSelectedAddressId(addr.id);
        setShippingFee(Number(addr.shipping_fee || 0));
        setForm(prev => ({
            ...prev,
            delivery_address: addr.address_line,
            delivery_ward_name: addr.ward_name
        }));
        fetchPrediction(addr.ward_name, orderDetails?.items);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleApplyVoucher = async () => {
        if (!orderDetails) {
            return;
        }

        if (!voucherCode.trim()) {
            setVoucherMessage("Vui lòng nhập mã voucher.");
            return;
        }

        setIsApplyingVoucher(true);
        setVoucherMessage("");

        try {
            const response = await voucherApi.validateForOrder({
                code: voucherCode,
                orderValue: Math.max(0, Number(orderDetails.subtotal || 0) - promotionDiscount)
            });

            if (!isMountedRef.current) return;

            const voucherData = response.data?.data;

            setOrderDetails((prev) => ({
                ...(prev || {}),
                discount_amount: Number(voucherData.discountAmount || 0),
                voucher_id: voucherData.voucherId,
                voucher_code: voucherData.code
            }));

            setAppliedVoucher({
                id: voucherData.voucherId,
                code: voucherData.code
            });
            setVoucherCode(voucherData.code || voucherCode.trim().toUpperCase());

            const messages = [`Áp dụng voucher ${voucherData.code} thành công.`];
            if (voucherData.maxUsagePerCustomer) {
                messages.push(`Bạn đã dùng ${voucherData.customerUsedCount || 0}/${voucherData.maxUsagePerCustomer} lượt.`);
            }
            setVoucherMessage(messages.join(" "));
        } catch (error) {
            if (!isMountedRef.current) return;
            const message = error.response?.data?.message || "Không thể áp dụng voucher.";
            setVoucherMessage(message);
            setAppliedVoucher(null);
            setOrderDetails((prev) => ({
                ...(prev || {}),
                discount_amount: 0,
                voucher_id: null,
                voucher_code: null
            }));
        } finally {
            if (isMountedRef.current) {
                setIsApplyingVoucher(false);
            }
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCode("");
        setVoucherMessage("Đã bỏ áp dụng voucher.");
        setOrderDetails((prev) => ({
            ...(prev || {}),
            discount_amount: 0,
            voucher_id: null,
            voucher_code: null
        }));
    };

    const handleConfirm = async (e) => {
        e.preventDefault();

        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour < 6 || currentHour >= 22) {
            notifyCustomer({
                message: "Nhà hàng chỉ phục vụ từ 6:00 đến 22:00. Vui lòng quay lại trong giờ hoạt động.",
                type: "warning"
            });
            return;
        }

        if (!form.delivery_full_name.trim()) {
            notifyCustomer({ message: "Vui lòng nhập họ tên người nhận.", type: "warning" });
            return;
        }

        if (!deliveryPhoneRegex.test(form.delivery_phone.trim())) {
            notifyCustomer({ message: "Số điện thoại giao hàng không hợp lệ.", type: "warning" });
            return;
        }

        if (!form.delivery_address.trim() || !form.delivery_ward_name.trim()) {
            notifyCustomer({ message: "Vui lòng nhập đầy đủ địa chỉ giao hàng.", type: "warning" });
            return;
        }

        if (!wards.some((ward) => ward.name === form.delivery_ward_name.trim())) {
            notifyCustomer({ message: "Vui lòng chọn phường từ danh sách có sẵn.", type: "warning" });
            return;
        }

        if (!["cash", "transfer", "vnpay"].includes(form.paymentMethod)) {
            notifyCustomer({ message: "Phương thức thanh toán không hợp lệ.", type: "warning" });
            return;
        }

        if (!orderDetails || !Array.isArray(orderDetails.items) || orderDetails.items.length === 0) {
            notifyCustomer({ message: "Đơn hàng không hợp lệ hoặc không có sản phẩm.", type: "error" });
            return;
        }

        setIsConfirmOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const computedTotal = Math.max(0, Number(orderDetails.subtotal) + shippingFee - promotionDiscount - Number(orderDetails.discount_amount || 0));
            const payload = {
                ...form,
                subtotal: orderDetails.subtotal,
                shipping_fee: shippingFee,
                discount_amount: orderDetails.discount_amount,
                total_amount: computedTotal,
                voucher_id: appliedVoucher?.id || null
            };
            await orderApi.confirm(orderCode, payload, form.paymentMethod);
            await cartApi.deleteAllCartItems();
            window.dispatchEvent(new Event("cartUpdated"));

            if (estimatedDelivery?.estimated_time) {
                localStorage.setItem("cadao_delivery_prediction", JSON.stringify({
                    orderCode,
                    estimated_time: estimatedDelivery.estimated_time,
                    estimated_minutes: estimatedDelivery.estimated_minutes,
                    created_at: new Date().toISOString()
                }));
                window.dispatchEvent(new Event("deliveryPredictionUpdated"));
            }

            if (form.paymentMethod === "vnpay") {
                const vnpayResponse = await orderApi.getVnpayUrl(orderCode);
                const paymentUrl = typeof vnpayResponse.data === "string"
                    ? vnpayResponse.data
                    : vnpayResponse.data?.paymentUrl || vnpayResponse.data?.url || vnpayResponse.data?.data?.paymentUrl;

                if (!paymentUrl) {
                    throw new Error("VNPAY_URL_NOT_FOUND");
                }

                notifyCustomer({ message: "Đang chuyển hướng đến cổng thanh toán VNPay...", type: "info" });
                window.location.href = paymentUrl;
                return;
            }

            if (form.paymentMethod === "transfer") {
                setTransferQrOrder({
                    orderCode,
                    totalAmount: computedTotal
                });
                setIsConfirmOpen(false);
                setIsSubmitting(false);
                return;
            }

            notifyCustomer({ message: `Đơn hàng xác nhận thành công! Mã đơn hàng: ${orderCode}`, type: "success" });
            navigate("/");
        } catch (error) {
            console.error("Failed to confirm order:", error);
            notifyCustomer({ message: "Xác nhận đơn hàng thất bại!", type: "error" });
        } finally {
            setIsSubmitting(false);
            setIsConfirmOpen(false);
        }
    };

    const computedTotal = orderDetails
        ? Math.max(0, Number(orderDetails.subtotal) + shippingFee - promotionDiscount - Number(orderDetails.discount_amount || 0))
        : 0;

    if (transferQrOrder) {
        const qrUrl = `https://img.vietqr.io/image/970423-0706348339-print.png?amount=${Math.round(transferQrOrder.totalAmount)}&addInfo=${encodeURIComponent(transferQrOrder.orderCode)}&accountName=NGUYEN%20THANH%20SANG`;
        return (
            <div>
                <Header />
                <div className="w-7xl mx-auto py-10 text-white">
                    <div data-aos="fade-up" className="text-center mb-12">
                        <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Thanh toán chuyển khoản</p>
                        <h1 className="text-5xl font-bold mb-5">Quét mã QR</h1>
                        <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                    </div>

                    <div className="max-w-lg mx-auto space-y-6">
                        <img
                            src={qrUrl}
                            alt="QR chuyển khoản ngân hàng"
                            className="w-full rounded-lg border-3 border-[#e4c590]"
                        />

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="w-full group relative overflow-hidden px-8 py-4 border border-[#e4c590]/60 text-[#e4c590] rounded-lg cursor-pointer"
                        >
                            <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                            <span className="relative z-10 text-sm font-bold tracking-widest group-hover:text-black transition-colors">VỀ TRANG CHỦ</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header />

            <div className="w-7xl mx-auto py-10 text-white">
                <div data-aos="fade-up" className="text-center mb-12">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Hoàn tất đơn hàng</p>
                    <h1 className="text-5xl font-bold mb-5">Thanh toán</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                {orderDetails ? (
                    <form className="space-y-10" onSubmit={handleConfirm}>
                        <div data-aos="fade-up" className="bg-black/30 border border-white/10 rounded-xl p-6">
                            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Mã đơn hàng</p>
                            <p className="text-2xl font-bold text-[#e4c590] font-mono">{orderDetails.order_code}</p>
                        </div>

                        {addresses.length > 0 && (
                            <div data-aos="fade-up" data-aos-delay="100">
                                <h3 className="text-xl font-bold text-[#e4c590] mb-4 uppercase tracking-widest">Địa chỉ giao hàng</h3>
                                <div className="space-y-3">
                                    {addresses.map(addr => (
                                        <div
                                            key={addr.id}
                                            onClick={() => handleAddressSelect(addr)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedAddressId === addr.id
                                                ? 'border-[#e4c590]/60 bg-[#e4c590]/5'
                                                : 'border-white/10 bg-black/30 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <p className="text-white font-semibold mb-1">{addr.address_line}</p>
                                                    <p className="text-gray-400 text-sm">{addr.ward_name}</p>
                                                    <p className="text-[#e4c590] text-xs font-semibold mt-2">Phí ship: {Number(addr.shipping_fee || 0).toLocaleString('vi-VN')}đ</p>
                                                </div>
                                                {addr.is_default && (
                                                    <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-semibold">Mặc định</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Thời gian nhận hàng dự kiến */}
                        {selectedAddressId && (
                            <div data-aos="fade-up" data-aos-delay="175" className="bg-black/30 border border-white/10 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-[#e4c590] mb-4 uppercase tracking-widest flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                    Thời gian nhận hàng dự kiến
                                </h3>
                                {isLoadingPrediction ? (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span className="text-sm">Đang tính toán...</span>
                                    </div>
                                ) : estimatedDelivery?.estimated_time ? (
                                    <div className="flex items-center gap-4">
                                        <div className="bg-[#e4c590]/10 border border-[#e4c590]/30 rounded-lg px-5 py-3">
                                            <span className="text-2xl font-bold text-[#e4c590]">
                                                {new Date(estimatedDelivery.estimated_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            <p>Khoảng <span className="text-white font-semibold">{Math.round(estimatedDelivery.estimated_minutes)}</span> phút từ lúc đặt hàng</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">Không thể ước tính thời gian giao hàng.</p>
                                )}
                            </div>
                        )}

                        <div data-aos="fade-up" data-aos-delay="150" className="bg-black/30 border border-white/10 rounded-xl p-8">
                            <h3 className="text-xl font-bold text-[#e4c590] mb-6 uppercase tracking-widest">Thông tin giao hàng</h3>
                            <div className="grid lg:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs tracking-widest text-gray-400 uppercase">Họ tên người nhận</span>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                        </svg>
                                        <input
                                            type="text"
                                            name="delivery_full_name"
                                            value={form.delivery_full_name}
                                            onChange={handleChange}
                                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                        />
                                    </div>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs tracking-widest text-gray-400 uppercase">Số điện thoại</span>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
                                        </svg>
                                        <input
                                            type="text"
                                            name="delivery_phone"
                                            value={form.delivery_phone}
                                            onChange={handleChange}
                                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                        />
                                    </div>
                                </label>

                                <label className="lg:col-span-2 flex flex-col gap-1.5">
                                    <span className="text-xs tracking-widest text-gray-400 uppercase">Địa chỉ</span>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/20 border border-white/5 rounded-lg">
                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                                        </svg>
                                        <span className="flex-1 text-white text-sm">
                                            {form.delivery_address || <span className="text-gray-500 italic">Vui lòng chọn địa chỉ ở trên</span>}
                                        </span>
                                    </div>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs tracking-widest text-gray-400 uppercase">Phường</span>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/20 border border-white/5 rounded-lg">
                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        </svg>
                                        <span className="flex-1 text-white text-sm">
                                            {form.delivery_ward_name || <span className="text-gray-500 italic">--</span>}
                                        </span>
                                    </div>
                                </label>

                                <label className="lg:col-span-2 flex flex-col gap-1.5">
                                    <span className="text-xs tracking-widest text-gray-400 uppercase">Ghi chú (tùy chọn)</span>
                                    <div className="flex items-start gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        <textarea
                                            name="notes"
                                            value={form.notes}
                                            onChange={handleChange}
                                            placeholder="Ví dụ: Không cay, giao lúc 6h tối..."
                                            rows={3}
                                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none resize-none text-sm"
                                        />
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div data-aos="fade-up" data-aos-delay="200" className="bg-black/30 border border-white/10 rounded-xl p-8">
                            <h3 className="text-xl font-bold text-[#e4c590] mb-4 uppercase tracking-widest">Phương thức thanh toán</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cash"
                                        checked={form.paymentMethod === "cash"}
                                        onChange={handleChange}
                                        className="w-4 h-4 accent-[#e4c590]"
                                    />
                                    <span className="text-white font-semibold">Thanh toán khi nhận hàng</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="transfer"
                                        checked={form.paymentMethod === "transfer"}
                                        onChange={handleChange}
                                        className="w-4 h-4 accent-[#e4c590]"
                                    />
                                    <span className="text-white font-semibold">Chuyển khoản ngân hàng</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="vnpay"
                                        checked={form.paymentMethod === "vnpay"}
                                        onChange={handleChange}
                                        className="w-4 h-4 accent-[#e4c590]"
                                    />
                                    <span className="text-white font-semibold">Thanh toán VNPay</span>
                                </label>

                            </div>
                        </div>

                        <div data-aos="fade-up" data-aos-delay="250" className="bg-black/30 border border-white/10 rounded-xl p-8">
                            <h3 className="text-xl font-bold text-[#e4c590] mb-4 uppercase tracking-widest">Mã giảm giá</h3>
                            <div className="flex gap-3 mb-4">
                                <input
                                    type="text"
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value)}
                                    placeholder="SUMMER50..."
                                    className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#e4c590] transition-colors uppercase"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyVoucher}
                                    disabled={isApplyingVoucher}
                                    className="group relative overflow-hidden px-8 py-3 border border-[#e4c590]/60 text-[#e4c590] rounded-lg cursor-pointer disabled:opacity-60"
                                >
                                    <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                    <span className="relative z-10 text-sm font-semibold group-hover:text-black transition-colors">
                                        {isApplyingVoucher ? "..." : "ÁP DỤNG"}
                                    </span>
                                </button>
                                {appliedVoucher && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveVoucher}
                                        className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-semibold"
                                    >
                                        BỎ
                                    </button>
                                )}
                            </div>
                            {voucherMessage && (
                                <p className={`text-sm ${appliedVoucher ? "text-green-400" : "text-amber-300"}`}>
                                    {voucherMessage}
                                </p>
                            )}
                        </div>

                        <div data-aos="fade-up" data-aos-delay="300" className="bg-black/30 border border-white/10 rounded-xl p-8">
                            <h3 className="text-xl font-bold text-[#e4c590] mb-6 uppercase tracking-widest">Chi tiết đơn hàng</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-300">
                                    <span>Tạm tính ({orderDetails.items.length} món)</span>
                                    <span>{Number(orderDetails.subtotal).toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Phí vận chuyển</span>
                                    <span className="text-[#e4c590]">{shippingFee.toLocaleString('vi-VN')}đ</span>
                                </div>
                                {promotionDiscount > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Khuyến mãi</span>
                                        <span>-{promotionDiscount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                                {Number(orderDetails.discount_amount) > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Voucher</span>
                                        <span>-{Number(orderDetails.discount_amount).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-white/10 pt-3 text-2xl font-bold">
                                    <span>Tổng cộng</span>
                                    <span className="text-[#e4c590]">{computedTotal.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto mb-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-2 px-3 text-[#e4c590] font-semibold uppercase tracking-wider">Tên</th>
                                            <th className="text-center py-2 px-3 text-[#e4c590] font-semibold uppercase tracking-wider">SL</th>
                                            <th className="text-right py-2 px-3 text-[#e4c590] font-semibold uppercase tracking-wider">Giá</th>
                                            <th className="text-right py-2 px-3 text-[#e4c590] font-semibold uppercase tracking-wider">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orderDetails.items.map((item, idx) => {
                                            const promo = promotionMap[item.menu_item_id];
                                            const itemTotal = Number(item.price) * Number(item.quantity);
                                            let itemPromoDiscount = 0;
                                            if (promo) {
                                                if (promo.discount_percent) {
                                                    itemPromoDiscount = Math.round(itemTotal * Number(promo.discount_percent) / 100);
                                                } else if (promo.discount_amount) {
                                                    itemPromoDiscount = Math.min(Number(promo.discount_amount) * Number(item.quantity), itemTotal);
                                                }
                                            }
                                            return (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-3 text-gray-300">
                                                        {item.name}
                                                        {promo && (
                                                            <span className="ml-2 text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                                                                -{promo.discount_percent ? `${promo.discount_percent}%` : `${Number(promo.discount_amount).toLocaleString('vi-VN')}đ`}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-center text-gray-300">{item.quantity}</td>
                                                    <td className="py-3 px-3 text-right text-gray-400 text-sm">{Number(item.price).toLocaleString('vi-VN')}đ</td>
                                                    <td className="py-3 px-3 text-right">
                                                        {itemPromoDiscount > 0 ? (
                                                            <div>
                                                                <span className="line-through text-gray-500 text-xs mr-1">{itemTotal.toLocaleString('vi-VN')}đ</span>
                                                                <span className="text-[#e4c590] font-semibold">{(itemTotal - itemPromoDiscount).toLocaleString('vi-VN')}đ</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[#e4c590] font-semibold">{itemTotal.toLocaleString('vi-VN')}đ</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div data-aos="fade-up" data-aos-delay="350" className="flex gap-4">
                            <button
                                type="submit"
                                className="flex-1 group relative overflow-hidden px-8 py-4 border border-green-500/60 text-green-400 rounded-lg cursor-pointer"
                            >
                                <span className="absolute inset-0 bg-green-500 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                                <span className="relative z-10 text-sm font-bold tracking-widest group-hover:text-black transition-colors">XÁC NHẬN ĐẶT HÀNG</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/cart-items")}
                                className="px-8 py-4 bg-black/40 border border-gray-500/40 text-gray-400 rounded-lg hover:border-gray-400 transition-colors text-sm font-semibold cursor-pointer"
                            >
                                QUAY LẠI GIỎ HÀNG
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-400">Đang tải chi tiết đơn hàng...</p>
                    </div>
                )}
            </div>

            <CustomerConfirmModal
                isOpen={isConfirmOpen}
                title="Xác nhận đặt hàng?"
                description={`Tổng thanh toán: ${computedTotal.toLocaleString('vi-VN')}đ. Bạn có chắc chắn muốn đặt hàng không?`}
                confirmText="Xác nhận đặt hàng"
                cancelText="Kiểm tra lại"
                tone="default"
                busy={isSubmitting}
                onConfirm={handleConfirmSubmit}
                onClose={() => setIsConfirmOpen(false)}
            />
        </div>
    );
};

export default CheckoutPage;