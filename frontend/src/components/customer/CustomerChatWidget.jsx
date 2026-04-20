import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import chatApi from "../../api/chatApi";
import { notifyCustomer } from "../../utils/customerNotify";
import { useSocket } from "../../contexts/SocketContext";

const parseTokenPayload = () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
        return null;
    }

    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
};

const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
};

const formatDateLabel = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "Hôm nay";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const TypingDots = () => (
    <div className="mr-auto flex items-end gap-2 max-w-[85%]">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4c590]/15 text-[#e4c590] text-[10px]">
            <i className="fa-solid fa-robot" />
        </span>
        <div className="rounded-2xl rounded-bl-sm bg-white/6 border border-white/8 px-4 py-3">
            <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e4c590]/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#e4c590]/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#e4c590]/60 animate-bounce [animation-delay:300ms]" />
            </div>
        </div>
    </div>
);

const CustomerChatWidget = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const socket = useSocket();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [errorText, setErrorText] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [deliveryPrediction, setDeliveryPrediction] = useState(null);
    const [countdown, setCountdown] = useState("");
    const listRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const tokenPayload = parseTokenPayload();
    const isCustomer = tokenPayload?.role === "customer";
    const isPortalPath = location.pathname.startsWith("/admin") || location.pathname.startsWith("/shipper");
    const shouldRender = !isPortalPath;

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const loadMessages = useCallback(async (conversationId) => {
        const res = await chatApi.getMessages(conversationId);
        setMessages(res.data?.data || []);
    }, []);

    const loadConversation = useCallback(async () => {
        if (!isCustomer) {
            return null;
        }

        const startRes = await chatApi.startConversation();
        const conv = startRes.data?.data || null;
        setConversation(conv);

        if (conv?.id) {
            await loadMessages(conv.id);
            await chatApi.markAsRead(conv.id);
        }

        return conv;
    }, [isCustomer, loadMessages]);

    const syncBotStatus = useCallback(async () => {
        if (!conversation?.id || !isCustomer) {
            return;
        }

        const res = await chatApi.getConversations();
        const list = res.data?.data || [];
        const latest = list.find((item) => Number(item.id) === Number(conversation.id));

        if (latest) {
            setConversation((prev) => ({ ...prev, ...latest }));
        }
    }, [conversation?.id, isCustomer]);

    // Fetch unread count when widget is closed
    useEffect(() => {
        if (!isCustomer || isOpen) return;

        const fetchUnread = async () => {
            try {
                const res = await chatApi.getUnreadCount();
                setUnreadCount(res.data?.data?.unreadCount || 0);
            } catch {
                // silent
            }
        };

        fetchUnread();
        const intervalId = setInterval(fetchUnread, 30000);
        return () => clearInterval(intervalId);
    }, [isCustomer, isOpen]);

    useEffect(() => {
        if (!shouldRender || !isOpen || !isCustomer) {
            return;
        }

        let stop = false;
        setIsLoading(true);
        setErrorText("");

        loadConversation()
            .catch((error) => {
                if (!stop) {
                    setErrorText(error.response?.data?.message || "Không thể tải cuộc trò chuyện.");
                }
            })
            .finally(() => {
                if (!stop) {
                    setIsLoading(false);
                    setUnreadCount(0);
                }
            });

        return () => {
            stop = true;
        };
    }, [isOpen, isCustomer, shouldRender, loadConversation]);

    // Socket: join/leave conversation room + listen for real-time events
    useEffect(() => {
        if (!socket || !conversation?.id) return;

        socket.emit("chat:join", conversation.id);

        const handleNewMessage = (msg) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                const next = prev.filter((m) => !(String(m.id).startsWith("temp-") && m.sender_type === msg.sender_type && m.text === msg.text));
                return [...next, msg];
            });
            if (msg.sender_type === "bot" || msg.sender_type === "admin") {
                setIsSending(false);
            }
            if (!isOpen) {
                setUnreadCount((prev) => prev + 1);
            }
        };
        const handleBotToggled = ({ isBotActive }) => {
            setConversation((prev) => prev ? { ...prev, is_bot_active: isBotActive } : prev);
        };

        socket.on("chat:newMessage", handleNewMessage);
        socket.on("chat:botToggled", handleBotToggled);

        return () => {
            socket.emit("chat:leave", conversation.id);
            socket.off("chat:newMessage", handleNewMessage);
            socket.off("chat:botToggled", handleBotToggled);
        };
    }, [socket, conversation?.id, isOpen]);

    // Fallback polling (giảm tần suất)
    useEffect(() => {
        if (!isOpen || !conversation?.id || !isCustomer) {
            return;
        }

        const intervalId = setInterval(async () => {
            try {
                await loadMessages(conversation.id);
            } catch {
                // Silent polling error.
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, [isOpen, conversation?.id, isCustomer, loadMessages]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, scrollToBottom]);

    // Focus input when widget opens
    useEffect(() => {
        if (isOpen && !isLoading) {
            inputRef.current?.focus();
        }
    }, [isOpen, isLoading]);

    // Load delivery prediction from localStorage
    useEffect(() => {
        const loadPrediction = () => {
            try {
                const raw = localStorage.getItem("cadao_delivery_prediction");
                if (!raw) { setDeliveryPrediction(null); return; }
                const data = JSON.parse(raw);
                const eta = new Date(data.estimated_time);
                if (eta.getTime() <= Date.now()) {
                    localStorage.removeItem("cadao_delivery_prediction");
                    setDeliveryPrediction(null);
                } else {
                    setDeliveryPrediction(data);
                }
            } catch {
                setDeliveryPrediction(null);
            }
        };

        loadPrediction();
        window.addEventListener("deliveryPredictionUpdated", loadPrediction);
        return () => window.removeEventListener("deliveryPredictionUpdated", loadPrediction);
    }, []);

    // Countdown timer for delivery prediction
    useEffect(() => {
        if (!deliveryPrediction?.estimated_time) { setCountdown(""); return; }

        const tick = () => {
            const diff = new Date(deliveryPrediction.estimated_time).getTime() - Date.now();
            if (diff <= 0) {
                setCountdown("");
                setDeliveryPrediction(null);
                localStorage.removeItem("cadao_delivery_prediction");
                return false;
            }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
            return true;
        };

        if (!tick()) return;
        const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
        return () => clearInterval(id);
    }, [deliveryPrediction]);

    const conversationTitle = useMemo(() => {
        if (!conversation?.is_bot_active) {
            return "Nhân viên hỗ trợ";
        }

        return "Trợ lý Ca Dao";
    }, [conversation?.is_bot_active]);

    const handleOpen = () => {
        if (!isCustomer) {
            notifyCustomer({
                message: "Vui lòng đăng nhập tài khoản khách hàng để sử dụng chat hỗ trợ.",
                type: "warning"
            });
            navigate("/auth/login");
            return;
        }

        setIsOpen((prev) => !prev);
    };

    const handleSend = async (sendText) => {
        if (!conversation?.id) {
            return;
        }

        const payloadText = String(sendText || "").trim();
        if (!payloadText) {
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            sender_type: "customer",
            text: payloadText,
            created_at: new Date().toISOString()
        };

        setIsSending(true);
        setErrorText("");
        setText("");
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            const res = await chatApi.sendMessage({
                conversationId: conversation.id,
                text: payloadText
            });

            const userMessage = res.data?.data?.userMessage;
            const aiMessage = res.data?.data?.aiMessage;
            const nextBotStatus = res.data?.data?.isBotActive;
            const cartUpdated = res.data?.data?.cartUpdated;

            setMessages((prev) => {
                let next = prev.filter((m) => m.id !== tempId);
                if (userMessage && !next.some((m) => m.id === userMessage.id)) {
                    next.push(userMessage);
                }
                if (aiMessage && !next.some((m) => m.id === aiMessage.id)) {
                    next.push(aiMessage);
                }
                return next;
            });

            if (cartUpdated) {
                window.dispatchEvent(new Event("cartUpdated"));
            }

            setConversation((prev) => prev ? { ...prev, is_bot_active: nextBotStatus } : prev);
            await chatApi.markAsRead(conversation.id);
        } catch (error) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setErrorText(error.response?.data?.message || "Không thể gửi tin nhắn.");
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    const handleRequestHuman = async () => {
        await handleSend("[REQUEST_HUMAN]");
    };

    const quickReplies = [
        { label: "Thực đơn", icon: "fa-utensils", text: "Cho mình xem thực đơn" },
        { label: "Ưu đãi", icon: "fa-ticket", text: "Có khuyến mãi/voucher gì không?" },
        { label: "Giỏ hàng", icon: "fa-cart-shopping", text: "Xem giỏ hàng của mình" },
        { label: "Đặt hàng", icon: "fa-bag-shopping", text: "Đặt hàng giỏ hàng hiện tại giúp mình" },
        { label: "Đơn hàng", icon: "fa-truck", text: "Đơn hàng của mình đang ở đâu?" },
        { label: "Gợi ý", icon: "fa-lightbulb", text: "Gợi ý món cho mình" }
    ];

    const handleQuickReply = (qr) => {
        if (isSending) return;
        handleSend(qr.text);
    };

    const groupedMessages = useMemo(() => {
        const groups = [];
        let lastDate = "";
        for (const msg of messages) {
            const d = new Date(msg.created_at).toDateString();
            if (d !== lastDate) {
                groups.push({ type: "date", label: formatDateLabel(msg.created_at), key: `date-${d}` });
                lastDate = d;
            }
            groups.push({ type: "msg", data: msg, key: `msg-${msg.id}` });
        }
        return groups;
    }, [messages]);

    if (!shouldRender) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-70">
            {isOpen ? (
                <div className="mb-3 flex flex-col w-95 max-w-[92vw] h-140 max-h-[80vh] rounded-2xl border border-[#e4c590]/20 bg-gray-950/97 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${conversation?.is_bot_active ? "bg-[#e4c590]/15 text-[#e4c590]" : "bg-emerald-500/15 text-emerald-400"}`}>
                                    <i className={`fa-solid ${conversation?.is_bot_active ? "fa-robot" : "fa-headset"}`} />
                                </span>
                                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-950 ${conversation?.is_bot_active ? "bg-[#e4c590]" : "bg-emerald-400"}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{conversationTitle}</p>
                                <p className="text-[11px] text-white/40">
                                    {conversation?.is_bot_active ? "Trả lời tự động 24/7" : "Đang trực tuyến"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {conversation?.is_bot_active && (
                                <button
                                    type="button"
                                    disabled={isSending}
                                    onClick={handleRequestHuman}
                                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#e4c590]/80 transition hover:bg-[#e4c590]/10 hover:text-[#e4c590] disabled:opacity-50"
                                    title="Gọi nhân viên hỗ trợ"
                                >
                                    <i className="fa-solid fa-headset mr-1" />
                                    Nhân viên
                                </button>
                            )}
                            <button
                                type="button"
                                className="rounded-lg p-2 text-white/40 hover:bg-white/6 hover:text-white transition"
                                onClick={() => setIsOpen(false)}
                            >
                                <i className="fa-solid fa-xmark text-sm" />
                            </button>
                        </div>
                    </div>

                    {/* Delivery prediction floating banner */}
                    {deliveryPrediction && countdown && (
                        <div className="mx-4 mt-2 flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#e4c590]/15 to-[#e4c590]/5 border border-[#e4c590]/25 px-4 py-3 animate-in slide-in-from-top-2 fade-in duration-300">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e4c590]/20">
                                <i className="fa-solid fa-truck-fast text-[#e4c590] text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-white/50 leading-tight">Dự đoán đơn hàng <span className="font-semibold text-[#e4c590]">{deliveryPrediction.orderCode}</span></p>
                                <p className="text-xs text-white/80 mt-0.5">sẽ đến trong <span className="font-bold text-[#e4c590] text-sm tabular-nums">{countdown}</span></p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setDeliveryPrediction(null);
                                    localStorage.removeItem("cadao_delivery_prediction");
                                }}
                                className="shrink-0 rounded-lg p-1 text-white/30 hover:text-white/60 hover:bg-white/5 transition"
                                title="Đóng"
                            >
                                <i className="fa-solid fa-xmark text-xs" />
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/30">
                                <i className="fa-solid fa-spinner fa-spin text-xl mb-2 text-[#e4c590]/50" />
                                <p className="text-sm">Đang tải...</p>
                            </div>
                        ) : null}
                        {!isLoading && messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="w-16 h-16 rounded-full bg-[#e4c590]/10 flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-comments text-2xl text-[#e4c590]/50" />
                                </div>
                                <p className="text-sm text-white/50 text-center mb-1 font-medium">Xin chào!</p>
                                <p className="text-xs text-white/30 text-center mb-5">Bạn cần hỗ trợ gì hôm nay?</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {quickReplies.map((qr) => (
                                        <button
                                            key={qr.text}
                                            type="button"
                                            onClick={() => handleQuickReply(qr)}
                                            className="rounded-full border border-[#e4c590]/20 bg-[#e4c590]/6 px-3 py-1.5 text-[11px] text-[#e4c590]/80 transition hover:bg-[#e4c590]/15 hover:text-[#e4c590] hover:border-[#e4c590]/30"
                                        >
                                            <i className={`fa-solid ${qr.icon} mr-1.5`} />
                                            {qr.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {groupedMessages.map((item) => {
                            if (item.type === "date") {
                                return (
                                    <div key={item.key} className="flex items-center gap-3 py-2">
                                        <div className="flex-1 border-t border-white/6" />
                                        <span className="shrink-0 text-[10px] font-medium text-white/25">{item.label}</span>
                                        <div className="flex-1 border-t border-white/6" />
                                    </div>
                                );
                            }

                            const msg = item.data;
                            const isSelf = msg.sender_type === "customer";
                            const isBot = msg.sender_type === "bot";

                            return (
                                <div key={item.key} className={`flex items-end gap-2 ${isSelf ? "justify-end" : "justify-start"}`}>
                                    {!isSelf && (
                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] ${isBot ? "bg-[#e4c590]/15 text-[#e4c590]" : "bg-emerald-500/15 text-emerald-400"}`}>
                                            <i className={`fa-solid ${isBot ? "fa-robot" : "fa-headset"}`} />
                                        </span>
                                    )}
                                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${isSelf
                                        ? "rounded-br-sm bg-[#e4c590] text-gray-950"
                                        : "rounded-bl-sm bg-white/6 border border-white/6 text-white/90"
                                        }`}>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                        <p className={`mt-1 text-[10px] ${isSelf ? "text-gray-950/40" : "text-white/25"}`}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {isSending && conversation?.is_bot_active && <TypingDots />}
                        <div ref={messagesEndRef} />
                    </div>

                    {errorText ? <p className="px-4 pb-1 text-xs text-rose-400">{errorText}</p> : null}

                    {/* Quick Replies - hiện khi đã có tin nhắn */}
                    {!isLoading && messages.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
                            {quickReplies.map((qr) => (
                                <button
                                    key={qr.text}
                                    type="button"
                                    disabled={isSending}
                                    onClick={() => handleQuickReply(qr)}
                                    className="shrink-0 rounded-full border border-white/8 bg-white/3 px-2.5 py-1 text-[11px] text-white/40 transition hover:bg-white/6 hover:text-white/60 hover:border-white/12 disabled:opacity-40"
                                >
                                    <i className={`fa-solid ${qr.icon} mr-1`} />
                                    {qr.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input area */}
                    <div className="border-t border-white/8 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(text);
                                    }
                                }}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#e4c590]/30 focus:bg-white/6 transition"
                                disabled={isSending}
                            />
                            <button
                                type="button"
                                onClick={() => handleSend(text)}
                                disabled={isSending || !text.trim()}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4c590] text-gray-950 transition hover:bg-[#d4b580] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                <i className="fa-solid fa-paper-plane text-sm" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {!isOpen && (
                <button
                    type="button"
                    onClick={handleOpen}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#e4c590] text-gray-950 shadow-[0_8px_30px_rgba(228,197,144,0.3)] transition-all hover:scale-105 hover:shadow-[0_8px_40px_rgba(228,197,144,0.4)]"
                    aria-label="Mở chat hỗ trợ"
                    title="Chat hỗ trợ"
                >
                    <i className="fa-solid fa-comments text-xl" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
};

export default CustomerChatWidget;
