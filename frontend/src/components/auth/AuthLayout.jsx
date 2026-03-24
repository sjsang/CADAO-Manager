import { Link } from "react-router-dom";

const THEME = {
    customer: {
        overlay: "bg-[radial-gradient(circle_at_20%_15%,rgba(228,197,144,0.22),transparent_38%),radial-gradient(circle_at_80%_85%,rgba(255,214,142,0.14),transparent_36%)]",
        cardBorder: "border-white/15",
        closeHover: "hover:border-[#e4c590] hover:text-[#e4c590]",
        eyebrow: "text-[#e4c590]/90"
    },
    admin: {
        overlay: "bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.24),transparent_36%),radial-gradient(circle_at_84%_86%,rgba(16,185,129,0.18),transparent_35%)]",
        cardBorder: "border-white/20",
        closeHover: "hover:border-sky-300 hover:text-sky-200",
        eyebrow: "text-sky-300/85"
    }
};

const AuthLayout = ({
    mode = "customer",
    closeTo = "/",
    closeLabel = "Quay ve trang chu",
    eyebrow,
    title,
    subtitle,
    children,
    footer
}) => {
    const theme = THEME[mode] || THEME.customer;

    return (
        <div className="relative flex min-h-screen items-center justify-center px-4 py-8 text-white">
            <div className={`pointer-events-none absolute inset-0 ${theme.overlay}`} />

            <div className={`relative w-full max-w-md rounded-2xl border ${theme.cardBorder} bg-black/45 p-7 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-lg sm:p-8`}>
                <Link
                    to={closeTo}
                    aria-label={closeLabel}
                    className={`absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white transition hover:scale-105 ${theme.closeHover}`}
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </Link>

                <p className={`mb-2 text-xs tracking-[0.24em] uppercase ${theme.eyebrow}`}>{eyebrow}</p>
                <h1 className="mb-1 text-3xl font-extrabold text-white">{title}</h1>
                <p className="mb-6 text-sm text-slate-300">{subtitle}</p>

                {children}

                {footer ? <div className="mt-5 space-y-2 text-sm">{footer}</div> : null}
            </div>
        </div>
    );
};

export default AuthLayout;
