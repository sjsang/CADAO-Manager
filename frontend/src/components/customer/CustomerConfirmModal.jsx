import { createPortal } from "react-dom";

const TONE_STYLES = {
    danger: {
        border: "border-red-500/40",
        confirmBtn: "border border-red-500/60 text-red-400 hover:bg-red-500 hover:text-black",
        icon: (
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        )
    },
    warning: {
        border: "border-amber-500/40",
        confirmBtn: "border border-amber-500/60 text-amber-400 hover:bg-amber-500 hover:text-black",
        icon: (
            <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        )
    },
    default: {
        border: "border-[#e4c590]/30",
        confirmBtn: "border border-[#e4c590]/60 text-[#e4c590] hover:bg-[#e4c590] hover:text-black",
        icon: (
            <svg className="w-7 h-7 text-[#e4c590]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    }
};

const CustomerConfirmModal = ({
    isOpen,
    title,
    description,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    tone = "danger",
    busy = false,
    onConfirm,
    onClose,
}) => {
    if (!isOpen || typeof document === "undefined") return null;

    const styles = TONE_STYLES[tone] || TONE_STYLES.default;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={`bg-linear-to-b from-black/60 to-black/80 border ${styles.border} text-white rounded-2xl p-8 w-full max-w-md shadow-2xl`}>
                <div className="flex flex-col items-center text-center gap-4 mb-6">
                    {styles.icon}
                    <h2 className="text-xl font-bold">{title}</h2>
                    {description && (
                        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
                    )}
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-6" />

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 px-5 py-3 bg-black/30 border border-white/10 text-gray-300 rounded-lg hover:border-white/30 transition-colors text-sm font-semibold disabled:opacity-50 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className={`flex-1 px-5 py-3 bg-transparent rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 cursor-pointer ${styles.confirmBtn}`}
                    >
                        {busy ? "..." : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CustomerConfirmModal;
