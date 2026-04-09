import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import categoryApi from "../../api/categoryApi";
import menuTypeApi from "../../api/menu_typeApi";
import { notifyCustomer } from "../../utils/customerNotify";

const CategoryCreate = () => {
    const navigate = useNavigate();

    const [menuTypes, setMenuTypes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        name: "",
        menuTypeId: ""
    });

    useEffect(() => {
        const fetchMenuTypes = async () => {
            try {
                const response = await menuTypeApi.getAll();
                const data = response.data || [];
                setMenuTypes(data);

                if (data.length > 0) {
                    setForm((prev) => ({ ...prev, menuTypeId: String(data[0].id) }));
                }
            } catch {
                notifyCustomer({ message: "Không tải được danh sách loại món.", type: "error" });
            }
        };

        fetchMenuTypes();
    }, []);

    const onFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Tên danh mục không được để trống.";
        }

        if (!form.menuTypeId) {
            newErrors.menuTypeId = "Vui lòng chọn loại món.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await categoryApi.create({
                name: form.name.trim(),
                menuTypeId: form.menuTypeId
            });

            notifyCustomer({ message: "Thêm danh mục thành công.", type: "success" });
            navigate("/admin/menu-categories");
        } catch (error) {
            const message = error.response?.data?.message || "Không thể thêm danh mục. Vui lòng thử lại.";
            notifyCustomer({ message, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="menu" />

            <div className="flex-1">
                <AdminHeader
                    title="Thêm danh mục mới"
                    subtitle="Tạo danh mục mới để phân loại nhóm món ăn trong thực đơn."
                />

                <div className="p-6">
                    <button
                        onClick={() => navigate("/admin/menu-categories")}
                        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>

                    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Thông tin danh mục</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Chọn nhóm món tương ứng để hệ thống hiển thị danh mục chính xác ở trang thực đơn.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tên danh mục</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => onFieldChange("name", e.target.value)}
                                        placeholder="Ví dụ: Món canh"
                                        className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.name ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`}
                                    />
                                    {errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name}</p> : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Loại món</label>
                                    <select
                                        value={form.menuTypeId}
                                        onChange={(e) => onFieldChange("menuTypeId", e.target.value)}
                                        className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.menuTypeId ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"}`}
                                    >
                                        {menuTypes.map((type) => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    {errors.menuTypeId ? <p className="mt-1 text-sm text-rose-600">{errors.menuTypeId}</p> : null}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/menu-categories")}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isSubmitting ? "Đang lưu..." : "Thêm danh mục"}
                                </button>
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CategoryCreate;
