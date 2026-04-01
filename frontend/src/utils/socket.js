import { io } from "socket.io-client";

let socket = null;

const SOCKET_URL = "http://localhost:3000";

export const connectSocket = (token) => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
        console.log("[Socket] Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
        console.warn("[Socket] Connection error:", err.message);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;
