import { useEffect, useMemo, useState } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import SideBarMenu from "../../components/admin/SideBarMenu";
import wardApi from "../../api/wardApi";
import TablePagination from "../../components/admin/TablePagination";

const PAGE_SIZE = 8;

const initialFormData = {
    name: "",
    shippingFee: ""
};

const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || fallbackMessage;
};

const WardManager = () => {
    const [wards, setWards] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 });
    const [formData, setFormData] = useState(initialFormData);
    const [editingWardId, setEditingWardId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

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

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingWardId(null);
    };

    const refreshWards = async (successMessage) => {
        await fetchWards();

        if (successMessage) {
            setFeedback({
                type: "success",
                message: successMessage
            });
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = (ward) => {
        setEditingWardId(ward.id);
        setFormData({
            name: ward.name || "",
            shippingFee: String(ward.shipping_fee ?? "")
        });
        setFeedback(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        try {
            const payload = {
                name: formData.name,
                shippingFee: formData.shippingFee
            };

            if (editingWardId) {
                await wardApi.updateWard(editingWardId, payload);
                await refreshWards("Cập nhật phường thành công.");
            } else {
                await wardApi.createWard(payload);
                await refreshWards("Thêm phường mới thành công.");
            }

            resetForm();
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể lưu thông tin phường.")
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (ward) => {
        const confirmed = window.confirm(`Xóa phường "${ward.name}"?`);

        if (!confirmed) {
            return;
        }

        setFeedback(null);

        try {
            await wardApi.deleteWard(ward.id);

            if (editingWardId === ward.id) {
                resetForm();
            }

            await refreshWards("Xóa phường thành công.");
        } catch (error) {
            setFeedback({
                type: "error",
                message: getErrorMessage(error, "Không thể xóa phường.")
            });
        }
    };

    const formatCurrency = (value) => {
        return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
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

                    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <p className="text-xs font-semibold tracking-[0.2em] text-blue-500 uppercase">Biểu mẫu</p>
                                <h2 className="mt-2 text-xl font-bold text-slate-800">
                                    {editingWardId ? "Cập nhật phường" : "Thêm phường mới"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Nhập tên phường và phí vận chuyển áp dụng cho đơn hàng giao đến khu vực đó.
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tên phường</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: Phường 1"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Phí giao hàng</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        name="shippingFee"
                                        value={formData.shippingFee}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: 15000"
                                        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Đang lưu..." : editingWardId ? "Lưu thay đổi" : "Thêm phường"}
                                    </button>
                                    {editingWardId ? (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                                        >Hủy</button>
                                    ) : null}
                                </div>
                            </form>
                        </article>

                        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h2 className="text-lg font-semibold text-slate-800">Danh sách phường</h2>
                                <p className="mt-1 text-sm text-slate-500">Chọn sửa để cập nhật phí ship hoặc xóa những phường không còn phục vụ.</p>
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
                                            <tr key={ward.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-700">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{ward.name}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(ward.shipping_fee)}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(ward)}
                                                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 transition hover:bg-blue-100"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(ward)}
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
                        </article>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default WardManager;