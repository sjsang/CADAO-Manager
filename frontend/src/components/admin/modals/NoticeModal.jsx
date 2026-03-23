import AdminModal from "./AdminModal";

const NoticeModal = ({
    isOpen,
    title,
    description,
    acknowledgeText = "Đã hiểu",
    tone = "warning",
    onClose
}) => {
    return (
        <AdminModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            tone={tone}
            maxWidthClass="max-w-md"
        >
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${tone === "warning" ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-900 hover:bg-slate-700"}`}
                >
                    {acknowledgeText}
                </button>
            </div>
        </AdminModal>
    );
};

export default NoticeModal;
