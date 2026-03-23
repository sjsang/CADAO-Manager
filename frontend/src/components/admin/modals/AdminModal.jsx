const AdminModal = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    maxWidthClass = "max-w-lg",
    tone = "default"
}) => {
    if (!isOpen) {
        return null;
    }

    const toneClass = tone === "warning"
        ? "border-amber-200"
        : tone === "danger"
            ? "border-rose-200"
            : "border-slate-200";

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
            <div className={`w-full ${maxWidthClass} rounded-2xl border ${toneClass} bg-white p-6 shadow-2xl`} role="dialog" aria-modal="true">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                        aria-label="Đóng"
                    >
                        x
                    </button>
                </div>
                <div className="mt-5">{children}</div>
            </div>
        </div>
    );
};

export default AdminModal;
