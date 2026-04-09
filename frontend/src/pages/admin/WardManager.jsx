import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader";
import SideBarMenu from "../../components/admin/SideBarMenu";
import wardApi from "../../api/wardApi";
import TablePagination from "../../components/admin/TablePagination";
import ConfirmModal from "../../components/admin/modals/ConfirmModal";

const PAGE_SIZE = 8;

const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || fallbackMessage;
};

const formatCurrency = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
};

const WardManager = () => {
    const navigate = useNavigate();

    const [wards, setWards] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);
    const [deletingWard, setDeletingWard] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchWards = async ({ showLoading = false } = {}) => {
        if (showLoading) {
            setIsLoading(true);
        }

        try {
            const response = await wardApi.getWards({
                search,
                sortBy,
                sortDir,
                page,
                limit: PAGE_SIZE
            });

            setWards(response.data?.data || []);
            setPagination(response.data?.pagination || { page, limit: PAGE_SIZE, totalItems: (response.data?.data || []).length, totalPages: 1 });
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể tải danh sách phường.")
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWards({ showLoading: true });
    }, [search, sortBy, sortDir, page]);

    useEffect(() => {
        setPage(1);
    }, [search, sortBy, sortDir]);

    const averageShippingFee = useMemo(() => {
        if (!wards.length) {
            return 0;
        }

        const total = wards.reduce((sum, ward) => sum + Number(ward.shipping_fee || 0), 0);
        return total / wards.length;
    }, [wards]);

    const handleConfirmDelete = async () => {
        if (!deletingWard) {
            return;
        }

        setIsDeleting(true);
        setFeedback(null);

        try {
            await wardApi.deleteWard(deletingWard.id);
            await fetchWards();
            setFeedback({ type: "success", message: "Xóa phường thành công." });
            setDeletingWard(null);
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể xóa phường.")
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="wards" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý phường"
                    subtitle="Thiết lập danh sách phường giao hàng và phí ship tương ứng."
                />

                <main className="p-6">
                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm phường theo tên..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                    className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="name">Sắp xếp: Tên phường</option>
                                    <option value="shipping_fee">Sắp xếp: Phí ship</option>
                                </select>

                                <select
                                    value={sortDir}
                                    onChange={(event) => setSortDir(event.target.value)}
                                    className="rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="asc">Tăng dần</option>
                                    <option value="desc">Giảm dần</option>
                                </select>

                                <button
                                    className="rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600"
                                    onClick={() => navigate("/admin/wards/add")}
                                >
                                    Thêm phường
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700">
                                    Tổng phường: <strong>{wards.length}</strong>
                                </span>
                                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                                    Phí ship TB: <strong>{formatCurrency(averageShippingFee)}</strong>
                                </span>
                            </div>
                        </div>

                        {feedback ? (
                            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                                {feedback.message}
                            </div>
                        ) : null}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-800">Danh sách phường</h2>
                            <p className="mt-1 text-sm text-slate-500">Nhấn vào hàng để chỉnh sửa, hoặc xóa những phường không còn phục vụ.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Tên phường</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Phí ship</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Đang tải danh sách phường...
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading && wards.map((ward, index) => (
                                        <tr
                                            key={ward.id}
                                            className="hover:bg-slate-50 cursor-pointer"
                                            onClick={() => navigate(`/admin/wards/${ward.id}`)}
                                        >
                                            <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{ward.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(ward.shipping_fee)}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/admin/wards/${ward.id}`);
                                                        }}
                                                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletingWard(ward);
                                                        }}
                                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 transition hover:bg-rose-100"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {!isLoading && wards.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có phường phù hợp với từ khóa tìm kiếm.
                                            </td>
                                        </tr>
                                    ) : null}
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
                    </section>
                </main>
            </div>

            <ConfirmModal
                isOpen={Boolean(deletingWard)}
                title="Xác nhận xóa phường"
                description={deletingWard ? `Bạn có chắc muốn xóa phường "${deletingWard.name}"? Hành động này không thể hoàn tác.` : ""}
                confirmText="Xóa phường"
                cancelText="Giữ lại"
                tone="danger"
                busy={isDeleting}
                onClose={() => setDeletingWard(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default WardManager;
