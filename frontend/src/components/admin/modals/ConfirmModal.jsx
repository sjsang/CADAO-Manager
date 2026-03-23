import AdminModal from "./AdminModal";

const ConfirmModal = ({
    isOpen,
    title,
    description,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    tone = "danger",
    busy = false,
    onConfirm,
    onClose
}) => {
    return (
        <AdminModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            tone={tone}
        >
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    {cancelText}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={busy}
                    className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-700"}`}
                >
                    {busy ? "Đang xử lý..." : confirmText}
                </button>
            </div>
        </AdminModal>
    );
};

export default ConfirmModal;
