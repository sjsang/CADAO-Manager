import { useEffect, useState } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import SideBarMenu from "../../components/admin/SideBarMenu";
import TablePagination from "../../components/admin/TablePagination";
import reviewApi from "../../api/reviewApi";
import { formatDateDDMMYYYY } from "../../functions/formatDate";

const PAGE_SIZE = 10;

const ReviewManager = () => {
    const [reviews, setReviews] = useState([]);
    const [search, setSearch] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true);
            try {
                const response = await reviewApi.getReviewsForAdmin({
                    search,
                    rating: ratingFilter,
                    sortDir,
                    page,
                    limit: PAGE_SIZE
                });

                if (response.data?.success) {
                    setReviews(response.data.data || []);
                    setPagination(response.data.pagination || { page, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
                } else {
                    setReviews([]);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
                setReviews([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [search, ratingFilter, sortDir, page]);

    useEffect(() => {
        setPage(1);
    }, [search, ratingFilter, sortDir]);

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="reviews" />

            <div className="flex-1">
                <AdminHeader
                    title="Danh sách đánh giá"
                    subtitle="Theo dõi phản hồi của khách hàng sau khi hoàn thành đơn hàng."
                />

                <main className="p-6">
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <input
                                type="text"
                                placeholder="Tìm theo mã đơn, khách hàng, nội dung..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />

                            <select
                                value={ratingFilter}
                                onChange={(event) => setRatingFilter(event.target.value)}
                                className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <option value="all">Tất cả số sao</option>
                                <option value="5">5 sao</option>
                                <option value="4">4 sao</option>
                                <option value="3">3 sao</option>
                                <option value="2">2 sao</option>
                                <option value="1">1 sao</option>
                            </select>

                            <select
                                value={sortDir}
                                onChange={(event) => setSortDir(event.target.value)}
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
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Mã đơn</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Khách hàng</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Sao</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Nội dung</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày đánh giá</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Đang tải danh sách đánh giá...
                                            </td>
                                        </tr>
                                    ) : reviews.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có đánh giá phù hợp.
                                            </td>
                                        </tr>
                                    ) : (
                                        reviews.map((review, index) => (
                                            <tr key={review.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{review.order_code}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    <p className="font-medium text-slate-800">{review.customer_name || "-"}</p>
                                                    <p className="text-xs text-slate-500">{review.customer_phone || "-"}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-amber-500">{"★".repeat(Number(review.rating || 0))}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{review.content}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{formatDateDDMMYYYY(review.created_at)}</td>
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

export default ReviewManager;
