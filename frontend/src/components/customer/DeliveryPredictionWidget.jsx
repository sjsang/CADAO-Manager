import { use, useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useNavigate } from "react-router-dom";
import {
    readDeliveryPredictions,
    removeDeliveryPrediction,
    saveDeliveryPrediction,
    updateDeliveryPredictionStatus
} from "../../utils/deliveryPredictionStorage";

const isActiveStatus = (status) => ["pending", "confirmed", "preparing", "shipping"].includes(status);

const isCustomerLoggedIn = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload?.role === "customer";
    } catch {
        return false;
    }
};

const DeliveryPredictionWidget = () => {
    const socket = useSocket();
    const [canUsePrediction, setCanUsePrediction] = useState(isCustomerLoggedIn);
    const [orders, setOrders] = useState(() => readDeliveryPredictions());
    const [countdowns, setCountdowns] = useState({});
    const [isMinimized, setIsMinimized] = useState(false);

    const navigate = useNavigate();

    const navigateToOrder = (orderCode) => {
        navigate(`/orders/${orderCode}`);
    };

    // Cập nhật trạng thái login khi user đăng nhập/đăng xuất
    useEffect(() => {
        const handleAuthChange = () => setCanUsePrediction(isCustomerLoggedIn());
        window.addEventListener("authChanged", handleAuthChange);
        return () => window.removeEventListener("authChanged", handleAuthChange);
    }, []);

    // Load predictions from localStorage
    useEffect(() => {
        if (!canUsePrediction) {
            setOrders([]);
            return;
        }

        const loadPredictions = () => {
            setOrders(readDeliveryPredictions());
        };

        loadPredictions();

        const onManualRefresh = () => loadPredictions();
        window.addEventListener("deliveryPredictionUpdated", onManualRefresh);

        return () => {
            window.removeEventListener("deliveryPredictionUpdated", onManualRefresh);
        };
    }, [canUsePrediction]);

    // Realtime updates
    useEffect(() => {
        if (!socket || !canUsePrediction) return;

        const handleDeliveryPrediction = ({ orderCode, estimatedMinutes, estimatedTime }) => {
            if (!orderCode || !estimatedTime) return;
            setOrders(saveDeliveryPrediction({
                orderCode,
                status: "pending",
                estimated_minutes: estimatedMinutes,
                estimated_time: estimatedTime,
                updated_at: new Date().toISOString()
            }));
        };

        const handleOrderStatusUpdated = ({ orderCode, status }) => {
            if (!orderCode || !status) return;

            if (isActiveStatus(status) || status === "completed" || status === "cancelled") {
                setOrders(updateDeliveryPredictionStatus(orderCode, status));
            }
        };

        socket.on("order:deliveryPrediction", handleDeliveryPrediction);
        socket.on("order:statusUpdated", handleOrderStatusUpdated);

        return () => {
            socket.off("order:deliveryPrediction", handleDeliveryPrediction);
            socket.off("order:statusUpdated", handleOrderStatusUpdated);
        };
    }, [socket, canUsePrediction]);

    // Countdown ticker — removes expired ETA rows
    useEffect(() => {
        if (orders.length === 0) {
            setCountdowns({});
            return;
        }

        const tick = () => {
            const now = Date.now();
            const newCountdowns = {};
            const stillActive = [];

            for (const o of orders) {
                const diff = new Date(o.estimated_time).getTime() - now;
                if (diff > 0 && isActiveStatus(o.status || "pending")) {
                    const mins = Math.floor(diff / 60000);
                    const secs = Math.floor((diff % 60000) / 1000);
                    newCountdowns[o.orderCode] = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                    stillActive.push(o);
                }
            }

            setCountdowns(newCountdowns);

            if (stillActive.length !== orders.length) {
                const staleOrderCodes = orders
                    .filter((order) => !stillActive.some((item) => item.orderCode === order.orderCode))
                    .map((item) => item.orderCode);

                staleOrderCodes.forEach((orderCode) => removeDeliveryPrediction(orderCode));
                setOrders(stillActive);
            }
        };

        tick();
        const timerId = setInterval(tick, 1000);
        return () => clearInterval(timerId);
    }, [orders]);

    const removeOrder = (orderCode) => {
        setOrders(removeDeliveryPrediction(orderCode));
    };

    if (!canUsePrediction || orders.length === 0) return null;

    return (
        <div className="fixed top-32 right-6 z-50">
            {/* Thu nhỏ: chỉ hiện icon + badge số lượng */}
            {isMinimized ? (
                <button
                    type="button"
                    onClick={() => setIsMinimized(false)}
                    title="Xem trạng thái giao hàng"
                    className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gray-950/95 border-2 border-[#e4c590]/35 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm transition hover:border-[#e4c590]/60 animate-in fade-in duration-200"
                >
                    <i className="fa-solid fa-truck-fast text-[#e4c590] text-base" />
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e4c590] text-[10px] font-bold text-gray-950 px-1 shadow">
                        {orders.length}
                    </span>
                </button>
            ) : (
                /* Mở rộng: danh sách tất cả đơn đang xử lý */
                <div className="w-72 max-w-[calc(100vw-3rem)] rounded-xl bg-gray-950/97 border-2 border-[#e4c590]/30 shadow-[0_14px_45px_rgba(0,0,0,0.5)] backdrop-blur-sm animate-in slide-in-from-right-3 fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-truck-fast text-[#e4c590] text-sm" />
                            <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Đơn đang giao</span>
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e4c590]/20 text-[10px] font-bold text-[#e4c590] px-1">
                                {orders.length}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMinimized(true)}
                            className="rounded-lg p-1 text-white/30 hover:text-white/60 hover:bg-white/5 transition"
                            title="Thu nhỏ"
                        >
                            <i className="fa-solid fa-minus text-xs" />
                        </button>
                    </div>

                    {/* Danh sách đơn */}
                    <ul className="divide-y divide-white/6 max-h-72 overflow-y-auto">
                        {orders.map((o) => (
                            <li key={o.orderCode}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition"
                                onClick={() => navigateToOrder(o.orderCode)}
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e4c590]/15">
                                    <i className="fa-solid fa-bag-shopping text-[#e4c590] text-[11px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-white/50 leading-tight truncate">
                                        Đơn hàng <span className="font-semibold text-[#e4c590]">{o.orderCode}</span>
                                    </p>
                                    <p className="text-xs text-white/80 mt-0.5">
                                        có thể đến trong{" "}
                                        <span className="font-bold text-[#e4c590] tabular-nums">
                                            {countdowns[o.orderCode] ?? "--:--"}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeOrder(o.orderCode)}
                                    className="shrink-0 rounded-lg p-1 text-white/20 hover:text-white/50 hover:bg-white/5 transition"
                                    title="Xóa"
                                >
                                    <i className="fa-solid fa-xmark text-[11px]" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DeliveryPredictionWidget;
