import { useEffect, useState } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import SideBarMenu from "../../components/admin/SideBarMenu";
import TablePagination from "../../components/admin/TablePagination";
import feedbackApi from "../../api/feedbackApi";
import { formatDateDDMMYYYY } from "../../functions/formatDate";

const PAGE_SIZE = 10;

const FeedbackManager = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [search, setSearch] = useState("");
    const [readFilter, setReadFilter] = useState("all");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });

    useEffect(() => {
        const fetchFeedbacks = async () => {
            setIsLoading(true);
            try {
                const response = await feedbackApi.getAll({
                    search,
                    is_read: readFilter,
                    sortDir,
                    page,
                    limit: PAGE_SIZE
                });

                if (response.data?.success) {
                    setFeedbacks(response.data.data || []);
                    setPagination(response.data.pagination || { page, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
                } else {
                    setFeedbacks([]);
                }
            } catch (error) {
                console.error("Failed to fetch feedbacks:", error);
                setFeedbacks([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeedbacks();
    }, [search, readFilter, sortDir, page]);

    useEffect(() => {
        setPage(1);
    }, [search, readFilter, sortDir]);

    const handleToggleRead = async (feedback) => {
        setTogglingId(feedback.id);
        try {
            const response = await feedbackApi.toggleRead(feedback.id);
            if (response.data?.success) {
                setFeedbacks((prev) =>
                    prev.map((f) =>
                        f.id === feedback.id ? { ...f, is_read: response.data.data.is_read } : f
                    )
                );
            }
        } catch (error) {
            console.error("Failed to toggle read:", error);
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (feedback) => {
        if (!window.confirm(`Xoá góp ý từ "${feedback.full_name}"?`)) return;
        setDeletingId(feedback.id);
        try {
            const response = await feedbackApi.delete(feedback.id);
            if (response.data?.success) {
                setFeedbacks((prev) => prev.filter((f) => f.id !== feedback.id));
                setPagination((prev) => ({ ...prev, totalItems: prev.totalItems - 1 }));
            }
        } catch (error) {
            console.error("Failed to delete feedback:", error);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="feedbacks" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý góp ý"
                    subtitle="Xem và quản lý góp ý từ khách hàng gửi qua trang Liên hệ."
                />

                <main className="p-6">
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <input
                                type="text"
                                placeholder="Tìm theo tên, email, nội dung..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />

                            <select
                                value={readFilter}
                                onChange={(e) => setReadFilter(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="all">Tất cả</option>
                                <option value="false">Chưa đọc</option>
                                <option value="true">Đã đọc</option>
                            </select>

                            <select
                                value={sortDir}
                                onChange={(e) => setSortDir(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="desc">Mới nhất</option>
                                <option value="asc">Cũ nhất</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Họ tên</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Email</th>
                                        <th className="w-2xl px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Nội dung</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày gửi</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Đang tải danh sách góp ý...
                                            </td>
                                        </tr>
                                    ) : feedbacks.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có góp ý nào.
                                            </td>
                                        </tr>
                                    ) : (
                                        feedbacks.map((fb, index) => (
                                            <tr key={fb.id} className={`hover:bg-slate-50 ${!fb.is_read ? "bg-blue-50/40" : ""}`}>
                                                <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{fb.full_name}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{fb.email}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700 max-w-md">
                                                    <p className="line-clamp-3">{fb.content}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{formatDateDDMMYYYY(fb.created_at)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${fb.is_read ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                                        {fb.is_read ? "Đã đọc" : "Chưa đọc"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleToggleRead(fb)}
                                                            disabled={togglingId === fb.id}
                                                            title={fb.is_read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                                                            className={`rounded-lg p-2 text-sm transition-colors ${togglingId === fb.id ? "opacity-40" : "hover:bg-slate-100"} ${fb.is_read ? "text-slate-400" : "text-blue-500"}`}
                                                        >
                                                            <i className={`fa-solid ${fb.is_read ? "fa-envelope-open" : "fa-envelope"}`} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(fb)}
                                                            disabled={deletingId === fb.id}
                                                            title="Xoá góp ý"
                                                            className={`rounded-lg p-2 text-sm text-red-500 transition-colors ${deletingId === fb.id ? "opacity-40" : "hover:bg-red-50"}`}
                                                        >
                                                            <i className="fa-solid fa-trash" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!isLoading ? (
                            <TablePagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                totalItems={pagination.totalItems}
                                onPageChange={setPage}
                            />
                        ) : null}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FeedbackManager;
