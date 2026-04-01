import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../utils/socket";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            disconnectSocket();
            setSocket(null);
            return;
        }

        const s = connectSocket(token);
        setSocket(s);

        return () => {
            // Không disconnect khi unmount vì có thể re-render
            // Chỉ disconnect khi logout
        };
    }, []);

    // Lắng nghe login/logout
    useEffect(() => {
        const handleStorageOrAuth = () => {
            const token = sessionStorage.getItem("token");
            if (token) {
                const s = connectSocket(token);
                setSocket(s);
            } else {
                disconnectSocket();
                setSocket(null);
            }
        };

        window.addEventListener("authChanged", handleStorageOrAuth);
        return () => window.removeEventListener("authChanged", handleStorageOrAuth);
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
