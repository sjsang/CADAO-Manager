import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import notificationApi from "../../api/notificationApi";
import { useSocket } from "../../contexts/SocketContext";

const typeIcons = {
    order: "fa-solid fa-box",
    promotion: "fa-solid fa-tag",
    general: "fa-solid fa-bell",
};

const typeColors = {
    order: "text-blue-400",
    promotion: "text-amber-400",
    general: "text-gray-400",
};

const NotificationDropdown = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const dropdownRef = useRef(null);
    const pollRef = useRef(null);

    const fetchUnreadCount = async () => {
        try {
            const res = await notificationApi.getUnreadCount();
            setUnreadCount(res.data.count);
        } catch {
            // ignore
        }
    };

    const fetchNotifications = async (pageNum = 1, append = false) => {
        setLoading(true);
        try {
            const res = await notificationApi.getAll({ page: pageNum, limit: 10 });
            const { data, pagination } = res.data;
            if (append) {
                setNotifications(prev => [...prev, ...data]);
            } else {
                setNotifications(data);
            }
            setHasMore(pagination.page < pagination.totalPages);
            setPage(pageNum);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    // Real-time qua socket + fallback polling
    useEffect(() => {
        fetchUnreadCount();

        // Fallback polling (giảm tần suất vì đã có socket)
        pollRef.current = setInterval(fetchUnreadCount, 60000);

        const handleNotificationUpdate = () => fetchUnreadCount();
        window.addEventListener("notificationUpdated", handleNotificationUpdate);

        return () => {
            clearInterval(pollRef.current);
            window.removeEventListener("notificationUpdated", handleNotificationUpdate);
        };
    }, []);

    // Socket listener cho thông báo mới
    useEffect(() => {
        if (!socket) return;

        const handleNew = (notif) => {
            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => [notif, ...prev]);
        };

        socket.on("notification:new", handleNew);
        return () => socket.off("notification:new", handleNew);
    }, [socket]);

    // Load notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications(1);
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleToggle = () => setIsOpen(prev => !prev);

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await notificationApi.markAsRead(notif.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch {
                // ignore
            }
        }
        if (notif.link) {
            navigate(notif.link);
            setIsOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {
            // ignore
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await notificationApi.delete(id);
            const deleted = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (deleted && !deleted.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch {
            // ignore
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchNotifications(page + 1, true);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return "Vừa xong";
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay < 7) return `${diffDay} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                className="relative w-10 h-10 text-[#e4c590] border-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e4c590] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c590]"
                onClick={handleToggle}
                aria-label="Thông báo"
            >
                <i className="fa-solid fa-bell text-xl"></i>
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-5 text-center shadow">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-gray-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h3 className="text-sm font-bold text-[#e4c590] tracking-wide uppercase">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-gray-400 hover:text-[#e4c590] transition-colors cursor-pointer"
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-[380px]">
                        {notifications.length === 0 && !loading ? (
                            <div className="px-4 py-10 text-center text-gray-500 text-sm">
                                Chưa có thông báo nào.
                            </div>
                        ) : (
                            <>
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/5 group ${notif.is_read
                                            ? "hover:bg-white/5"
                                            : "bg-white/5 hover:bg-white/10"
                                            }`}
                                    >
                                        <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 ${typeColors[notif.type] || typeColors.general}`}>
                                            <i className={`${typeIcons[notif.type] || typeIcons.general} text-sm`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm leading-snug ${notif.is_read ? "text-gray-400" : "text-white font-medium"}`}>
                                                    {notif.title}
                                                </p>
                                                <button
                                                    onClick={(e) => handleDelete(e, notif.id)}
                                                    className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                                                    title="Xóa"
                                                >
                                                    <i className="fa-solid fa-xmark text-xs"></i>
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                                            <p className="text-[10px] text-gray-600 mt-1">{formatTime(notif.created_at)}</p>
                                        </div>
                                        {!notif.is_read && (
                                            <span className="shrink-0 mt-2 w-2 h-2 rounded-full bg-blue-400"></span>
                                        )}
                                    </div>
                                ))}
                                {hasMore && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="w-full py-3 text-xs text-gray-400 hover:text-[#e4c590] transition-colors cursor-pointer"
                                    >
                                        {loading ? "Đang tải..." : "Xem thêm"}
                                    </button>
                                )}
                            </>
                        )}
                        {loading && notifications.length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                Đang tải...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
