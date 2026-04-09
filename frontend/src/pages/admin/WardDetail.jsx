import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import wardApi from "../../api/wardApi";
import { notifyCustomer } from "../../utils/customerNotify";
import ConfirmModal from "../../components/admin/modals/ConfirmModal";

const WardDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        name: "",
        shippingFee: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await wardApi.getWards({ page: 1, limit: 9999 });
                const allWards = response.data?.data || [];
                const ward = allWards.find((w) => String(w.id) === String(id));

                if (!ward) {
                    notifyCustomer({ message: "Không tìm thấy phường.", type: "error" });
                    navigate("/admin/wards");
                    return;
                }

                setForm({
                    name: ward.name || "",
                    shippingFee: String(ward.shipping_fee ?? "")
                });
            } catch {
                notifyCustomer({ message: "Không tải được chi tiết phường.", type: "error" });
                navigate("/admin/wards");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const onFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Tên phường không được để trống.";
        }

        const fee = Number(form.shippingFee);
        if (form.shippingFee === "" || !Number.isFinite(fee) || fee < 0) {
            newErrors.shippingFee = "Phí giao hàng phải lớn hơn hoặc bằng 0.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            await wardApi.updateWard(id, {
                name: form.name.trim(),
                shippingFee: form.shippingFee
            });

            notifyCustomer({ message: "Cập nhật phường thành công.", type: "success" });
            navigate("/admin/wards");
        } catch (error) {
            const message = error.response?.data?.message || "Không thể cập nhật phường. Vui lòng thử lại.";
            notifyCustomer({ message, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="wards" />
                <div className="flex flex-1 items-center justify-center text-slate-600">Đang tải dữ liệu phường...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="wards" />

            <div className="flex-1">
                <AdminHeader
                    title="Chi tiết phường"
                    subtitle="Xem và chỉnh sửa thông tin phường giao hàng."
                />

                <div className="p-6">
                    <form onSubmit={handleSave} className="mx-auto max-w-2xl">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin chỉnh sửa</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Cập nhật tên phường và phí vận chuyển áp dụng cho khu vực giao hàng.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tên phường</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => onFieldChange("name", e.target.value)}
                                        className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.name ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`}
                                    />
                                    {errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Phí giao hàng</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={form.shippingFee}
                                        onChange={(e) => onFieldChange("shippingFee", e.target.value)}
                                        className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.shippingFee ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`}
                                    />
                                    {errors.shippingFee ? <p className="mt-1 text-sm text-rose-600">{errors.shippingFee}</p> : null}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/wards")}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Xóa
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>

                            <ConfirmModal
                                isOpen={showDeleteModal}
                                title="Xóa phường/xã"
                                description="Bạn có chắc muốn xóa phường/xã này? Hành động không thể hoàn tác."
                                confirmText="Xóa"
                                cancelText="Hủy"
                                tone="danger"
                                busy={isDeleting}
                                onClose={() => setShowDeleteModal(false)}
                                onConfirm={async () => {
                                    setIsDeleting(true);
                                    try {
                                        await wardApi.deleteWard(id);
                                        notifyCustomer({ message: "Đã xóa phường/xã.", type: "success" });
                                        navigate("/admin/wards");
                                    } catch {
                                        notifyCustomer({ message: "Xóa phường/xã thất bại.", type: "error" });
                                    } finally {
                                        setIsDeleting(false);
                                        setShowDeleteModal(false);
                                    }
                                }}
                            />
                        </section>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WardDetail;
