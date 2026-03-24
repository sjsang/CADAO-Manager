import { useState } from "react";

const ACCENT = {
    customer: "border-white/15 focus:border-[#e4c590] focus:ring-[#e4c590]/30",
    admin: "border-slate-500/70 focus:border-sky-400 focus:ring-sky-500/40"
};

const ICON_ACCENT = {
    customer: "text-[#e4c590]/75",
    admin: "text-sky-300/80"
};

const FieldIcon = ({ type, name, mode }) => {
    const iconClass = `h-4 w-4 ${ICON_ACCENT[mode] || ICON_ACCENT.customer}`;

    if (name?.includes("phone")) {
        return (
            <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
        );
    }

    if (name?.includes("password") || type === "password") {
        return (
            <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        );
    }

    if (name?.includes("email") || type === "email") {
        return (
            <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
        );
    }

    return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    );
};

const AuthField = ({
    id,
    name,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    mode = "customer"
}) => {
    const accentClass = ACCENT[mode] || ACCENT.customer;
    const isPasswordField = type === "password" || name?.includes("password");
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

    return (
        <div className="space-y-1">
            <label htmlFor={id} className="text-sm font-medium text-slate-200">{label}</label>
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <FieldIcon type={type} name={name} mode={mode} />
                </span>
                <input
                    id={id}
                    type={inputType}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full rounded-xl border bg-black/45 pl-10 ${isPasswordField ? "pr-11" : "pr-4"} py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${error ? "border-red-400/80 focus:border-red-400 focus:ring-red-500/30" : accentClass}`}
                />
                {isPasswordField ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-300 transition-colors hover:text-white"
                        aria-label={showPassword ? "An mat khau" : "Hien thi mat khau"}
                    >
                        {showPassword ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M3 3l18 18" />
                                <path d="M10.58 10.58a3 3 0 0 0 4.24 4.24" />
                                <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a17.37 17.37 0 0 1-2.55 3.68" />
                                <path d="M6.61 6.61A17.35 17.35 0 0 0 2 12s3 7 10 7a10.94 10.94 0 0 0 4.91-1.17" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                ) : null}
            </div>
            {error ? <p className="text-xs text-red-300">{error}</p> : null}
        </div>
    );
};

export default AuthField;
