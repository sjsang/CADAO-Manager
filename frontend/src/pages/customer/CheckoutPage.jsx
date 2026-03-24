import Header from "../../components/customer/Header";
import AOS from "aos";
import orderApi from "../../api/orderApi";
import cartApi from "../../api/cartApi";
import customerApi from "../../api/customerApi";
import voucherApi from "../../api/voucherApi";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { notifyCustomer } from "../../utils/customerNotify";

const CheckoutPage = () => {
    const { orderCode } = useParams();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherMessage, setVoucherMessage] = useState("");
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [form, setForm] = useState({
        delivery_full_name: "",
        delivery_phone: "",
        delivery_address: "",
        delivery_ward_name: "",
        notes: "",
        paymentMethod: "cash"
    });

    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orderRes, addressRes] = await Promise.all([
                    orderApi.getByOrderCode(orderCode),
                    customerApi.getAddresses()
                ]);
                const order = orderRes.data.data;
                const addrs = addressRes.data.data || [];
                setOrderDetails(order);
                setShippingFee(Number(order.shipping_fee || 0));
                setVoucherCode(order.voucher_code || "");
                setAppliedVoucher(order.voucher_id ? { id: order.voucher_id, code: order.voucher_code || "" } : null);
                setAddresses(addrs);
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
                if (matched) setSelectedAddressId(matched.id);
                AOS.refresh();
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, [orderCode]);

    const handleAddressSelect = (addr) => {
        setSelectedAddressId(addr.id);
        setShippingFee(Number(addr.shipping_fee || 0));
        setForm(prev => ({
            ...prev,
            delivery_address: addr.address_line,
            delivery_ward_name: addr.ward_name
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "delivery_address" || name === "delivery_ward_name") {
            setSelectedAddressId(null);
        }
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
                orderValue: Number(orderDetails.subtotal || 0)
            });

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
            setVoucherMessage(`Áp dụng voucher ${voucherData.code} thành công.`);
        } catch (error) {
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
            setIsApplyingVoucher(false);
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
        try {
            const computedTotal = Number(orderDetails.subtotal) + shippingFee - Number(orderDetails.discount_amount || 0);
            const payload = {
                ...form,
                subtotal: orderDetails.subtotal,
                shipping_fee: shippingFee,
                discount_amount: orderDetails.discount_amount,
                total_amount: computedTotal,
                voucher_id: appliedVoucher?.id || null
            };
            await orderApi.confirm(orderCode, payload, form.paymentMethod);
            notifyCustomer({ message: `Đơn hàng xác nhận thành công! Mã đơn hàng: ${orderCode}`, type: "success" });
            await cartApi.deleteAllCartItems();
            window.dispatchEvent(new Event("cartUpdated"));
            navigate("/");
        } catch (error) {
            console.error("Failed to confirm order:", error);
            notifyCustomer({ message: "Xác nhận đơn hàng thất bại!", type: "error" });
        }
    };

    const computedTotal = orderDetails
        ? Number(orderDetails.subtotal) + shippingFee - Number(orderDetails.discount_amount || 0)
        : 0;

    return (
        <div>
            <Header />

            <div className="w-7xl mx-auto py-16 text-white">
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
                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                                        </svg>
                                        <input
                                            type="text"
                                            name="delivery_address"
                                            value={form.delivery_address}
                                            onChange={handleChange}
                                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                        />
                                    </div>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs tracking-widest text-gray-400 uppercase">Phường</span>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                        <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        </svg>
                                        <input
                                            type="text"
                                            name="delivery_ward_name"
                                            value={form.delivery_ward_name}
                                            onChange={handleChange}
                                            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                        />
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
                                {Number(orderDetails.discount_amount) > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Giảm giá</span>
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
                                        {orderDetails.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-3 text-gray-300">{item.name}</td>
                                                <td className="py-3 px-3 text-center text-gray-300">{item.quantity}</td>
                                                <td className="py-3 px-3 text-right text-gray-400 text-sm">{Number(item.price).toLocaleString('vi-VN')}đ</td>
                                                <td className="py-3 px-3 text-right text-[#e4c590] font-semibold">{Number(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                                            </tr>
                                        ))}
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
        </div>
    );
};

export default CheckoutPage;