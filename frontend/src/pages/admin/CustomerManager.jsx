import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import customerApi from "../../api/customerApi";
import { useEffect, useMemo, useState } from "react";

const CustomerManager = () => {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await customerApi.getCustomers();
                setCustomers(response.data?.data || []);
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        };

        fetchCustomers();
    }, []);

    const filteredCustomers = useMemo(() => {
        const normalized = search.trim().toLowerCase();

        if (!normalized) {
            return customers;
        }

        return customers.filter((customer) => {
            return [customer.full_name, customer.phone_number, customer.email]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalized));
        });
    }, [customers, search]);

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleDateString("vi-VN");
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="customers" />

            <div className="flex-1">
                <AdminHeader
                    title="Quản lý khách hàng"
                    subtitle="Tra cứu thông tin tài khoản và lịch sử mua hàng của khách."
                />

                <main className="p-6">
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <input
                            type="text"
                            placeholder="Tìm khách hàng theo tên, số điện thoại, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Họ tên</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">SĐT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Ngày tạo</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredCustomers.map((customer, index) => (
                                        <tr key={customer.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{customer.full_name || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{customer.phone_number || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{customer.email || "-"}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${customer.is_active ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                                                    {customer.is_active ? "Đang hoạt động" : "Đã khóa"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{formatDate(customer.created_at)}</td>
                                        </tr>
                                    ))}

                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                                Không có khách hàng phù hợp.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default CustomerManager;