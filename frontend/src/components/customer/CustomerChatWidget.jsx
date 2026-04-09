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

const TypingDots = () => (
    <div className="mr-auto flex items-end gap-2 max-w-[85%]">
        <div className="rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3">
            <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
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
                return [...prev, msg];
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

    const conversationTitle = useMemo(() => {
        if (!conversation?.is_bot_active) {
            return "Nhân viên đang hỗ trợ";
        }

        return "Trợ lý CADAO AI";
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

        setIsSending(true);
        setErrorText("");
        setText("");

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
                const next = [...prev];
                if (userMessage && !prev.some((m) => m.id === userMessage.id)) {
                    next.push(userMessage);
                }
                if (aiMessage && !prev.some((m) => m.id === aiMessage.id)) {
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
        { label: "Xem thực đơn", icon: "fa-utensils", text: "Cho mình xem thực đơn" },
        { label: "Voucher hôm nay", icon: "fa-ticket", text: "Có voucher gì không?" },
        { label: "Xem giỏ hàng", icon: "fa-cart-shopping", text: "Xem giỏ hàng của mình" },
        { label: "Đặt hàng ngay", icon: "fa-bag-shopping", text: "Đặt hàng giỏ hàng hiện tại giúp mình" },
        { label: "Đơn hàng của tôi", icon: "fa-truck", text: "Đơn hàng của mình đang ở đâu?" },
        { label: "Gợi ý cho tôi", icon: "fa-lightbulb", text: "Gợi ý món cho mình" }
    ];

    const handleQuickReply = (qr) => {
        if (isSending) return;
        handleSend(qr.text);
    };



    if (!shouldRender) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-70">
            {isOpen ? (
                <div className="mb-3 flex flex-col w-90 max-w-[92vw] rounded-2xl border border-white/20 bg-slate-950/95 text-white shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${conversation?.is_bot_active ? "bg-violet-500/20 text-violet-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                                <i className={`fa-solid ${conversation?.is_bot_active ? "fa-robot" : "fa-headset"}`} />
                            </span>
                            <div>
                                <p className="text-sm font-semibold">{conversationTitle}</p>
                                <p className="text-[11px] text-slate-400">
                                    {conversation?.is_bot_active ? "Trả lời tự động" : "Đang kết nối với nhân viên"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
                            onClick={() => setIsOpen(false)}
                        >
                            <i className="fa-solid fa-xmark text-sm" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={listRef} className="h-80 overflow-y-auto px-4 py-3 space-y-2.5">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <i className="fa-solid fa-spinner fa-spin text-xl mb-2" />
                                <p className="text-sm">Đang tải...</p>
                            </div>
                        ) : null}
                        {!isLoading && messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <i className="fa-regular fa-comment-dots text-3xl mb-2" />
                                <p className="text-sm text-center mb-3">Xin chào! Bạn cần hỗ trợ gì?</p>
                                <div className="flex flex-wrap justify-center gap-1.5">
                                    {quickReplies.map((qr) => (
                                        <button
                                            key={qr.text}
                                            type="button"
                                            onClick={() => handleQuickReply(qr)}
                                            className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-200 transition hover:bg-amber-500/20"
                                        >
                                            <i className={`fa-solid ${qr.icon} mr-1`} />
                                            {qr.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {messages.map((msg) => {
                            const isSelf = msg.sender_type === "customer";
                            const isBot = msg.sender_type === "bot";

                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isSelf ? "justify-end" : "justify-start"}`}>
                                    {!isSelf && (
                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${isBot ? "bg-violet-500/20 text-violet-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                                            <i className={`fa-solid ${isBot ? "fa-robot" : "fa-headset"}`} />
                                        </span>
                                    )}
                                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isSelf
                                        ? "rounded-br-sm bg-amber-500 text-black"
                                        : "rounded-bl-sm bg-white/10 text-white"
                                        }`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                        <p className={`mt-1 text-[10px] ${isSelf ? "text-black/50" : "text-slate-500"}`}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {isSending && conversation?.is_bot_active && <TypingDots />}
                        <div ref={messagesEndRef} />
                    </div>

                    {errorText ? <p className="px-4 pb-1 text-xs text-rose-300">{errorText}</p> : null}

                    {/* Quick Replies - hiện khi đã có tin nhắn */}
                    {!isLoading && messages.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
                            {quickReplies.map((qr) => (
                                <button
                                    key={qr.text}
                                    type="button"
                                    disabled={isSending}
                                    onClick={() => handleQuickReply(qr)}
                                    className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
                                >
                                    <i className={`fa-solid ${qr.icon} mr-1`} />
                                    {qr.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input area */}
                    <div className="border-t border-white/10 px-3 py-3">
                        {conversation?.is_bot_active && (
                            <div className="mb-2">
                                <button
                                    type="button"
                                    disabled={isSending}
                                    onClick={handleRequestHuman}
                                    className="rounded-lg border border-amber-300/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                                >
                                    <i className="fa-solid fa-headset mr-1" />
                                    Gọi nhân viên
                                </button>
                            </div>
                        )}

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
                                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50 focus:bg-white/10 transition"
                                disabled={isSending}
                            />
                            <button
                                type="button"
                                onClick={() => handleSend(text)}
                                disabled={isSending || !text.trim()}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-black shadow-xl transition hover:scale-105 hover:bg-amber-300"
                    aria-label="Mở chat hỗ trợ"
                    title="Chat hỗ trợ"
                >
                    <i className="fa-solid fa-comments text-xl" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
};

export default CustomerChatWidget;
