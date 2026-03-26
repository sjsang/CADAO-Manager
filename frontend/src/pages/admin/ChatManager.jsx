import { useCallback, useEffect, useMemo, useState } from "react";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import chatApi from "../../api/chatApi";

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

const ChatManager = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [busyToggle, setBusyToggle] = useState(false);

    const selectedConversation = useMemo(
        () => conversations.find((item) => Number(item.id) === Number(selectedConversationId)) || null,
        [conversations, selectedConversationId]
    );

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
    }, [selectedConversationId, fetchMessages]);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                await fetchConversations();
                if (selectedConversationId) {
                    await fetchMessages(selectedConversationId);
                }
            } catch {
                // Silent polling error.
            }
        }, 4000);

        return () => clearInterval(intervalId);
    }, [fetchConversations, fetchMessages, selectedConversationId]);

    const handleSend = async () => {
        if (!selectedConversationId || !text.trim()) {
            return;
        }

        setSending(true);
        try {
            await chatApi.sendMessage({
                conversationId: selectedConversationId,
                text: text.trim()
            });
            setText("");
            await fetchMessages(selectedConversationId);
            await fetchConversations();
        } finally {
            setSending(false);
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

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-900">
            <SideBarMenu activePage="chat" />
            <div className="flex-1">
                <AdminHeader
                    title="Hỗ trợ hội thoại"
                    subtitle={`Đang có ${totalUnread} tin nhắn khách chưa đọc`}
                />

                <main className="p-6">
                    <div className="grid min-h-[75vh] grid-cols-12 gap-4">
                        <section className="col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-lg font-semibold">Danh sách chat</h2>

                            {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
                            {!loading && conversations.length === 0 ? (
                                <p className="text-sm text-slate-500">Chưa có hội thoại nào.</p>
                            ) : null}

                            <div className="space-y-2">
                                {conversations.map((conv) => {
                                    const active = Number(conv.id) === Number(selectedConversationId);

                                    return (
                                        <button
                                            key={conv.id}
                                            type="button"
                                            onClick={() => setSelectedConversationId(conv.id)}
                                            className={`w-full rounded-xl border px-3 py-2 text-left transition ${active
                                                    ? "border-sky-300 bg-sky-50"
                                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-slate-800">{conv.customer_name || "Khách hàng"}</p>
                                                {Number(conv.unread_count || 0) > 0 ? (
                                                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                                                        {conv.unread_count}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="line-clamp-1 text-xs text-slate-500">{conv.last_message || "(Chưa có tin nhắn)"}</p>
                                            <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(conv.updated_at)}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="col-span-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            {!selectedConversation ? (
                                <p className="text-sm text-slate-500">Chọn một hội thoại để bắt đầu.</p>
                            ) : (
                                <>
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                                        <div>
                                            <p className="text-lg font-semibold">{selectedConversation.customer_name}</p>
                                            <p className="text-xs text-slate-500">{selectedConversation.customer_phone || "Không có số điện thoại"}</p>
                                        </div>

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
                                    </div>

                                    <div className="h-[52vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                        <div className="space-y-2">
                                            {messages.map((msg) => {
                                                const isCustomer = msg.sender_type === "customer";
                                                const isBot = msg.sender_type === "bot";

                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${isCustomer
                                                                ? "mr-auto bg-white border border-slate-200"
                                                                : "ml-auto bg-slate-900 text-white"
                                                            }`}
                                                    >
                                                        <p className="mb-1 text-[11px] font-semibold opacity-75">
                                                            {isCustomer ? "Khách" : isBot ? "Bot" : "Admin"}
                                                        </p>
                                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                                        <p className={`mt-1 text-[11px] ${isCustomer ? "text-slate-400" : "text-slate-300"}`}>
                                                            {formatDateTime(msg.created_at)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <input
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
                                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                                        />
                                        <button
                                            type="button"
                                            disabled={sending || !text.trim()}
                                            onClick={handleSend}
                                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Gửi
                                        </button>
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ChatManager;
