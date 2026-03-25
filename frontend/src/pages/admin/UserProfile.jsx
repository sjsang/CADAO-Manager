import { useEffect, useState } from "react";
import SideBarMenu from "../../components/admin/SideBarMenu";
import AdminHeader from "../../components/admin/AdminHeader";
import userApi from "../../api/userApi";
import { notifyCustomer } from "../../utils/customerNotify";

const buildCloudinaryUrl = (publicId) => {
    if (!publicId) {
        return "";
    }

    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload/${publicId}`;
};

const InfoRow = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-800">{value || "-"}</p>
    </div>
);

const ROLE_TEXT = {
    admin: "Admin",
    shipper: "Shipper"
};

const UserProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ full_name: "", phone_number: "", password: "" });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const loadProfile = async () => {
        const res = await userApi.getMyProfile();
        const data = res.data?.data || null;
        setProfile(data);
        if (data) {
            setForm({
                full_name: data.full_name || "",
                phone_number: data.phone_number || "",
                password: ""
            });
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                await loadProfile();
            } catch (error) {
                console.error("Failed to load profile:", error);
                notifyCustomer({ message: "Không tải được thông tin cá nhân.", type: "error" });
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const handleSave = async () => {
        if (form.password && form.password.length < 6) {
            notifyCustomer({ message: "Mật khẩu phải có ít nhất 6 ký tự.", type: "warning" });
            return;
        }

        setSaving(true);
        try {
            const res = await userApi.updateMyProfile({
                full_name: form.full_name.trim() || null,
                phone_number: form.phone_number.trim() || null,
                password: form.password || undefined
            });
            setProfile(res.data?.data || profile);
            setForm((prev) => ({ ...prev, password: "" }));
            setIsEditing(false);
            notifyCustomer({ message: "Cập nhật thông tin thành công.", type: "success" });
        } catch (error) {
            console.error("Failed to save profile:", error);
            notifyCustomer({ message: error.response?.data?.message || "Không thể cập nhật thông tin.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setUploadingAvatar(true);

        try {
            const response = await userApi.updateMyAvatar(file);
            const updated = response.data?.data;

            if (updated?.avatar_url) {
                setProfile((prev) => ({
                    ...prev,
                    avatar_url: updated.avatar_url
                }));
            }
        } catch (error) {
            console.error("Failed to update avatar:", error);
            notifyCustomer({ message: error.response?.data?.message || "Không thể cập nhật ảnh đại diện.", type: "error" });
        } finally {
            setUploadingAvatar(false);
            event.target.value = "";
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-slate-100">
                <SideBarMenu activePage="profile" />
                <div className="flex-1">
                    <AdminHeader title="Thông tin cá nhân" subtitle="Cập nhật hồ sơ tài khoản." />
                    <main className="p-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                            Đang tải thông tin...
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <SideBarMenu activePage="profile" />

            <div className="flex-1">
                <AdminHeader
                    title="Thông tin cá nhân"
                    subtitle="Quản lý hồ sơ tài khoản và mật khẩu đăng nhập."
                />

                <main className="p-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-300 bg-slate-100">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={buildCloudinaryUrl(profile.avatar_url)}
                                            alt="Avatar tài khoản"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No avatar</div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <h2 className="text-base font-semibold text-slate-800">Hồ sơ tài khoản</h2>
                                    <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                                        {uploadingAvatar ? "Đang tải..." : "Đổi ảnh đại diện"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            disabled={uploadingAvatar}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {!isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    Chỉnh sửa
                                </button>
                            ) : null}
                        </div>

                        {!profile ? (
                            <p className="text-sm text-rose-600">Không tìm thấy thông tin tài khoản.</p>
                        ) : isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Username</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={profile.username || ""}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={ROLE_TEXT[profile.role] || profile.role || ""}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Họ và tên</label>
                                        <input
                                            type="text"
                                            value={form.full_name}
                                            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Số điện thoại</label>
                                        <input
                                            type="text"
                                            value={form.phone_number}
                                            onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mật khẩu mới (để trống nếu không đổi)</label>
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                            placeholder="Ít nhất 6 ký tự"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setForm({
                                                full_name: profile.full_name || "",
                                                phone_number: profile.phone_number || "",
                                                password: ""
                                            });
                                        }}
                                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={handleSave}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                    >
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <InfoRow label="Username" value={profile.username} />
                                <InfoRow label="Vai trò" value={ROLE_TEXT[profile.role] || profile.role} />
                                <InfoRow label="Họ và tên" value={profile.full_name} />
                                <InfoRow label="Số điện thoại" value={profile.phone_number} />
                                <InfoRow label="Trạng thái" value={profile.is_active ? "Đang hoạt động" : "Đã khóa"} />
                                <InfoRow label="Ngày tạo" value={new Date(profile.created_at).toLocaleString()} />
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default UserProfilePage;
