import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            const token = sessionStorage.getItem("token");
            let role = null;

            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    role = payload?.role || null;
                } catch {
                    role = null;
                }
            }

            const isAdminPath = window.location.pathname.startsWith("/admin");
            const isShipperPath = window.location.pathname.startsWith("/shipper");
            const isPortalProfilePath = window.location.pathname === "/profile";
            const isAdminRequest = String(error.config?.url || "").includes("/auth/admin");
            const isPortalRole = ["admin", "shipper"].includes(role);
            const shouldRedirectToAdminLogin = isPortalRole || isAdminPath || isShipperPath || isPortalProfilePath || isAdminRequest;

            sessionStorage.removeItem("token");
            window.location.href = shouldRedirectToAdminLogin ? "/admin/login" : "/auth/login";
        }
        return Promise.reject(error);
    }
);

export default axiosClient;