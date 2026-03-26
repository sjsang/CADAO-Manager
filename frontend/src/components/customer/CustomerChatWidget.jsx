import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import chatApi from "../../api/chatApi";
import { notifyCustomer } from "../../utils/customerNotify";

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

const CustomerChatWidget = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [errorText, setErrorText] = useState("");

    const listRef = useRef(null);

    const tokenPayload = parseTokenPayload();
    const isCustomer = tokenPayload?.role === "customer";
    const isPortalPath = location.pathname.startsWith("/admin") || location.pathname.startsWith("/shipper");
    const shouldRender = !isPortalPath;

    const scrollToBottom = useCallback(() => {
        if (!listRef.current) {
            return;
        }

        listRef.current.scrollTop = listRef.current.scrollHeight;
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
                }
            });

        return () => {
            stop = true;
        };
    }, [isOpen, isCustomer, shouldRender, loadConversation]);

    useEffect(() => {
        if (!isOpen || !conversation?.id || !isCustomer) {
            return;
        }

        const intervalId = setInterval(async () => {
            try {
                await Promise.all([
                    loadMessages(conversation.id),
                    syncBotStatus()
                ]);
            } catch {
                // Silent polling error.
            }
        }, 4000);

        return () => clearInterval(intervalId);
    }, [isOpen, conversation?.id, isCustomer, loadMessages, syncBotStatus]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, scrollToBottom]);

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
        try {
            const res = await chatApi.sendMessage({
                conversationId: conversation.id,
                text: payloadText
            });

            const userMessage = res.data?.data?.userMessage;
            const aiMessage = res.data?.data?.aiMessage;
            const nextBotStatus = res.data?.data?.isBotActive;

            setMessages((prev) => {
                const next = [...prev];
                if (userMessage) {
                    next.push(userMessage);
                }
                if (aiMessage) {
                    next.push(aiMessage);
                }
                return next;
            });

            setConversation((prev) => prev ? { ...prev, is_bot_active: nextBotStatus } : prev);
            setText("");
            await chatApi.markAsRead(conversation.id);
        } catch (error) {
            setErrorText(error.response?.data?.message || "Không thể gửi tin nhắn.");
        } finally {
            setIsSending(false);
        }
    };

    const handleRequestHuman = async () => {
        await handleSend("[REQUEST_HUMAN]");
    };

    if (!shouldRender) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-70">
            {isOpen ? (
                <div className="mb-3 w-90 max-w-[92vw] rounded-2xl border border-white/20 bg-slate-950/95 text-white shadow-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold">{conversationTitle}</p>
                            <p className="text-xs text-slate-400">
                                {conversation?.is_bot_active ? "Bot đang bật" : "Bot đang tắt"}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
                            onClick={() => setIsOpen(false)}
                        >
                            Đóng
                        </button>
                    </div>

                    <div ref={listRef} className="h-80 overflow-y-auto px-4 py-3 space-y-3">
                        {isLoading ? <p className="text-sm text-slate-400">Đang tải hội thoại...</p> : null}
                        {!isLoading && messages.length === 0 ? (
                            <p className="text-sm text-slate-400">Chưa có tin nhắn. Bạn hãy bắt đầu cuộc trò chuyện.</p>
                        ) : null}

                        {messages.map((msg) => {
                            const isSelf = msg.sender_type === "customer";
                            const bubbleClass = isSelf
                                ? "ml-auto bg-amber-500 text-black"
                                : "mr-auto bg-white/10 text-white";

                            return (
                                <div key={msg.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${bubbleClass}`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <p className={`mt-1 text-[11px] ${isSelf ? "text-black/70" : "text-slate-400"}`}>
                                        {formatTime(msg.created_at)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {errorText ? <p className="px-4 pb-1 text-xs text-rose-300">{errorText}</p> : null}

                    <div className="border-t border-white/10 px-3 py-3">
                        <div className="mb-2 flex items-center gap-2">
                            <button
                                type="button"
                                disabled={isSending || !conversation?.is_bot_active}
                                onClick={handleRequestHuman}
                                className="rounded-lg border border-amber-300/50 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Gọi nhân viên
                            </button>
                            <span className="text-[11px] text-slate-400">Khi cần hỗ trợ trực tiếp</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
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
                                className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-amber-300"
                                disabled={isSending}
                            />
                            <button
                                type="button"
                                onClick={() => handleSend(text)}
                                disabled={isSending || !text.trim()}
                                className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <button
                type="button"
                onClick={handleOpen}
                className="h-13 w-13 rounded-full bg-amber-400 text-black font-bold shadow-xl transition hover:scale-105"
                aria-label="Mở chat hỗ trợ"
                title="Chat hỗ trợ"
            >
                Chat
            </button>
        </div>
    );
};

export default CustomerChatWidget;
