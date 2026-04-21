import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import chatApi from "../../api/chatApi";
import { useSocket } from "../../contexts/SocketContext";

const buildCloudinaryUrl = (publicId) => {
    if (!publicId) {
        return "";
    }

    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${publicId}`;
};

const formatDateTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit"
    });
};

const formatDateLabel = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return "Hôm nay";
    if (isYesterday) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const SenderIcon = ({ type, customer_avatar, admin_avatar }) => {
    if (type === "customer") {
        return (
            <img src={customer_avatar || ""} alt="" className="h-7 w-7 rounded-full shrink-0" />
        );
    }
    if (type === "bot") {
        return (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                <i className="fa-solid fa-robot" />
            </span>
        );
    }
    return (
        <img src={admin_avatar || ""} alt="" className="h-7 w-7 rounded-full shrink-0" />
    );
};

const TypingIndicator = () => (
    <div className="mr-auto flex items-end gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs text-violet-600">
            <i className="fa-solid fa-robot" />
        </span>
        <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-2.5">
            <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
            </div>
        </div>
    </div>
);

const ChatManager = () => {
    const socket = useSocket();
    const [searchParams, setSearchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(() => {
        const paramId = searchParams.get("conversationId");
        return paramId ? Number(paramId) : null;
    });
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [busyToggle, setBusyToggle] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [waitingBot, setWaitingBot] = useState(false);
    const [summary, setSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const selectedConversation = useMemo(
        () => conversations.find((item) => Number(item.id) === Number(selectedConversationId)) || null,
        [conversations, selectedConversationId]
    );

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(
            (c) =>
                (c.customer_name || "").toLowerCase().includes(q) ||
                (c.avatar_url || "").toLowerCase().includes(q) ||
                (c.customer_phone || "").includes(q) ||
                (c.last_message || "").toLowerCase().includes(q)
        );
    }, [conversations, searchQuery]);

    const fetchConversations = useCallback(async () => {
        const res = await chatApi.getConversations();
        const data = res.data?.data || [];
        setConversations(data);

        if (!selectedConversationId && data.length > 0) {
            setSelectedConversationId(data[0].id);
        }
    }, [selectedConversationId]);

    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        const res = await chatApi.getMessages(conversationId);
        setMessages(res.data?.data || []);
        await chatApi.markAsRead(conversationId);
    }, []);

    useEffect(() => {
        let stop = false;
        setLoading(true);

        Promise.all([fetchConversations()])
            .catch(() => { })
            .finally(() => {
                if (!stop) {
                    setLoading(false);
                }
            });

        return () => {
            stop = true;
        };
    }, [fetchConversations]);

    useEffect(() => {
        fetchMessages(selectedConversationId).catch(() => { });
        setSummary("");
    }, [selectedConversationId, fetchMessages]);

    const fetchSummary = useCallback(async () => {
        if (!selectedConversationId) return;
        setLoadingSummary(true);
        try {
            const res = await chatApi.getConversationSummary(selectedConversationId);
            setSummary(res.data?.data?.summary || "");
        } catch {
            setSummary("Không thể tóm tắt.");
        } finally {
            setLoadingSummary(false);
        }
    }, [selectedConversationId]);

    const handleDeleteConversation = useCallback(async () => {
        if (!deleteTarget) return;
        try {
            await chatApi.deleteConversation(deleteTarget);
            setConversations((prev) => prev.filter((c) => Number(c.id) !== Number(deleteTarget)));
            if (Number(selectedConversationId) === Number(deleteTarget)) {
                setSelectedConversationId(null);
                setMessages([]);
            }
        } catch {
            // silent
        } finally {
            setDeleteTarget(null);
        }
    }, [deleteTarget, selectedConversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Socket: join conversation room + listen for real-time events
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            if (msg.sender_type === "bot" || msg.sender_type === "admin") {
                setWaitingBot(false);
            }
        };
        const handleConvUpdated = () => {
            fetchConversations().catch(() => { });
        };

        socket.on("chat:newMessage", handleNewMessage);
        socket.on("chat:conversationUpdated", handleConvUpdated);

        return () => {
            socket.off("chat:newMessage", handleNewMessage);
            socket.off("chat:conversationUpdated", handleConvUpdated);
        };
    }, [socket, fetchConversations]);

    useEffect(() => {
        if (!socket || !selectedConversationId) return;

        socket.emit("chat:join", selectedConversationId);
        return () => {
            socket.emit("chat:leave", selectedConversationId);
        };
    }, [socket, selectedConversationId]);

    // Fallback polling (giảm tần suất)
    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                await fetchConversations();
            } catch {
                // Silent polling error.
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, [fetchConversations]);

    const handleSend = async () => {
        if (!selectedConversationId || !text.trim()) {
            return;
        }

        const msg = text.trim();
        setSending(true);
        setText("");

        if (selectedConversation?.is_bot_active) {
            setWaitingBot(true);
        }

        try {
            await chatApi.sendMessage({
                conversationId: selectedConversationId,
                text: msg
            });
            await fetchMessages(selectedConversationId);
            await fetchConversations();
        } finally {
            setSending(false);
            setWaitingBot(false);
            inputRef.current?.focus();
        }
    };

    const handleToggleBot = async () => {
        if (!selectedConversation) {
            return;
        }

        setBusyToggle(true);
        try {
            const nextStatus = !selectedConversation.is_bot_active;
            await chatApi.toggleBot(selectedConversation.id, nextStatus);
            await fetchConversations();
        } finally {
            setBusyToggle(false);
        }
    };

    const totalUnread = conversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0);

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

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
            <SideBarMenu activePage="chat" />
            <div className="flex flex-1 flex-col overflow-hidden">
                <AdminHeader
                    title="Hỗ trợ hội thoại"
                    subtitle={`Đang có ${totalUnread} tin nhắn khách chưa đọc`}
                />

                <main className="flex flex-1 overflow-hidden p-6">
                    <div className="flex flex-1 gap-4 overflow-hidden">
                        {/* Sidebar */}
                        <section className="w-80 shrink-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-4 pb-3">
                                <h2 className="mb-2 text-lg font-semibold">Danh sách chat</h2>
                                <div className="relative">
                                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm khách hàng..."
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-sky-300 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3">
                                {loading ? <p className="text-sm text-slate-400 text-center py-8">Đang tải...</p> : null}
                                {!loading && conversations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <i className="fa-regular fa-comments text-4xl mb-2" />
                                        <p className="text-sm">Chưa có hội thoại nào</p>
                                    </div>
                                ) : null}
                                {!loading && conversations.length > 0 && filteredConversations.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-6">Không tìm thấy kết quả</p>
                                ) : null}

                                <div className="space-y-1">
                                    {filteredConversations.map((conv) => {
                                        const active = Number(conv.id) === Number(selectedConversationId);
                                        const hasUnread = Number(conv.unread_count || 0) > 0;

                                        return (
                                            <button
                                                key={conv.id}
                                                type="button"
                                                onClick={() => setSelectedConversationId(conv.id)}
                                                className={`w-full rounded-xl px-3 py-2.5 text-left transition-all ${active
                                                    ? "bg-sky-50 ring-1 ring-sky-200"
                                                    : "hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img src={buildCloudinaryUrl(conv.avatar_url) || ""} alt="" className="h-9 w-9 rounded-full" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className={`truncate text-sm ${hasUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                                                                {conv.customer_name || "Khách hàng"}
                                                            </p>
                                                            <span className="shrink-0 text-[11px] text-slate-400">{formatDateTime(conv.updated_at)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                                            <p className={`truncate text-xs ${hasUnread ? "font-medium text-slate-600" : "text-slate-400"}`}>
                                                                {conv.last_message || "(Chưa có tin nhắn)"}
                                                            </p>
                                                            {hasUnread ? (
                                                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                                                                    {conv.unread_count}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Chat area */}
                        <section className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {!selectedConversation ? (
                                <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
                                    <i className="fa-regular fa-comment-dots text-5xl mb-3" />
                                    <p className="text-sm">Chọn một hội thoại để bắt đầu</p>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={buildCloudinaryUrl(selectedConversation.avatar_url) || ""} alt="" className="h-10 w-10 rounded-full" />
                                            <div>
                                                <p className="font-semibold text-slate-800">{selectedConversation.customer_name}</p>
                                                <p className="text-xs text-slate-400">{selectedConversation.customer_phone || "Không có SĐT"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${selectedConversation.is_bot_active
                                                ? "bg-violet-50 text-violet-600"
                                                : "bg-emerald-50 text-emerald-600"
                                                }`}>
                                                <i className={`fa-solid ${selectedConversation.is_bot_active ? "fa-robot" : "fa-headset"} mr-1`} />
                                                {selectedConversation.is_bot_active ? "Bot đang trả lời" : "Nhân viên đang hỗ trợ"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleToggleBot}
                                                disabled={busyToggle}
                                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${selectedConversation.is_bot_active
                                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                    } disabled:cursor-not-allowed disabled:opacity-60`}
                                            >
                                                {selectedConversation.is_bot_active ? "Tắt bot" : "Bật bot"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={fetchSummary}
                                                disabled={loadingSummary}
                                                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
                                                title="Tóm tắt hội thoại bằng AI"
                                            >
                                                <i className={`fa-solid ${loadingSummary ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"} mr-1`} />
                                                Tóm tắt
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(selectedConversation.id)}
                                                className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                                                title="Xóa hội thoại"
                                            >
                                                <i className="fa-solid fa-trash-can mr-1" />
                                                Xóa
                                            </button>
                                        </div>
                                    </div>

                                    {/* AI Summary */}
                                    {summary && (
                                        <div className="flex items-start gap-2 border-b border-slate-100 bg-violet-50 px-5 py-2.5">
                                            <i className="fa-solid fa-wand-magic-sparkles mt-0.5 text-xs text-violet-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-violet-700">Tóm tắt AI</p>
                                                <p className="text-xs text-violet-600 leading-relaxed">{summary}</p>
                                            </div>
                                            <button type="button" onClick={() => setSummary("")} className="text-violet-400 hover:text-violet-600">
                                                <i className="fa-solid fa-xmark text-xs" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto bg-slate-50/50 px-5 py-4">
                                        <div className="space-y-3">
                                            {groupedMessages.map((item) => {
                                                if (item.type === "date") {
                                                    return (
                                                        <div key={item.key} className="flex items-center gap-3 py-2">
                                                            <div className="flex-1 border-t border-slate-200" />
                                                            <span className="shrink-0 text-[11px] font-medium text-slate-400">{item.label}</span>
                                                            <div className="flex-1 border-t border-slate-200" />
                                                        </div>
                                                    );
                                                }

                                                const msg = item.data;
                                                const isCustomer = msg.sender_type === "customer";

                                                return (
                                                    <div key={item.key} className={`flex items-end gap-2 ${isCustomer ? "justify-start" : "justify-end"}`}>
                                                        {isCustomer && <SenderIcon type="customer" customer_avatar={buildCloudinaryUrl(msg.customer_avatar)} />}
                                                        <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${isCustomer
                                                            ? "rounded-bl-sm bg-white border border-slate-200 text-slate-800"
                                                            : msg.sender_type === "bot"
                                                                ? "rounded-br-sm bg-violet-600 text-white"
                                                                : "rounded-br-sm bg-slate-800 text-white"
                                                            }`}>
                                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                            <p className={`mt-1.5 text-[11px] ${isCustomer ? "text-slate-400" : "text-white/60"}`}>
                                                                {formatTime(msg.created_at)}
                                                            </p>
                                                        </div>
                                                        {!isCustomer && <SenderIcon type={msg.sender_type} admin_avatar={buildCloudinaryUrl(msg.admin_avatar)} />}
                                                    </div>
                                                );
                                            })}
                                            {waitingBot && <TypingIndicator />}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>

                                    {/* Input */}
                                    <div className="border-t border-slate-100 px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend();
                                                    }
                                                }}
                                                placeholder="Nhập tin nhắn trả lời khách..."
                                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 transition"
                                            />
                                            <button
                                                type="button"
                                                disabled={sending || !text.trim()}
                                                onClick={handleSend}
                                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <i className="fa-solid fa-paper-plane text-sm" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </main>

                {/* Delete confirmation modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Xóa hội thoại</h3>
                            <p className="text-sm text-slate-500 mb-5">Toàn bộ tin nhắn trong hội thoại sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(null)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteConversation}
                                    className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatManager;
