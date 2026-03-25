import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const TYPE_CLASS = {
    success: "border-emerald-400/50 text-emerald-300",
    error: "border-red-400/50 text-red-300",
    warning: "border-amber-400/50 text-amber-300",
    info: "border-[#e4c590]/50 text-[#e4c590]"
};

const TYPE_DOT_CLASS = {
    success: "bg-emerald-400",
    error: "bg-red-400",
    warning: "bg-amber-400",
    info: "bg-[#e4c590]"
};

const TOAST_EXIT_MS = 220;

const CustomerToast = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        let counter = 0;

        const handleToast = (event) => {
            const message = event.detail?.message;
            const type = event.detail?.type || "info";
            const duration = Number(event.detail?.duration || 2600);

            if (!message) {
                return;
            }

            counter += 1;
            const id = `${Date.now()}-${counter}`;

            setToasts((prev) => [...prev, { id, message, type, leaving: false }]);

            window.setTimeout(() => {
                setToasts((prev) =>
                    prev.map((toast) =>
                        toast.id === id ? { ...toast, leaving: true } : toast
                    )
                );

                window.setTimeout(() => {
                    setToasts((prev) => prev.filter((toast) => toast.id !== id));
                }, TOAST_EXIT_MS);
            }, duration);
        };

        window.addEventListener("customer-toast", handleToast);
        return () => window.removeEventListener("customer-toast", handleToast);
    }, []);

    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div className="fixed top-20 right-5 z-90 flex w-[min(92vw,420px)] flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto rounded-xl border bg-black/85 px-4 py-3 shadow-2xl backdrop-blur-sm ${toast.leaving ? "animate-[toastOut_220ms_ease-in_forwards]" : "animate-[toastIn_220ms_ease-out]"} ${TYPE_CLASS[toast.type] || TYPE_CLASS.info}`}
                >
                    <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${TYPE_DOT_CLASS[toast.type] || TYPE_DOT_CLASS.info}`} />
                        <p className="text-sm leading-relaxed font-medium">{toast.message}</p>
                    </div>
                </div>
            ))}
        </div>,
        document.body
    );
};

export default CustomerToast;
