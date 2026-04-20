import axiosClient from "./axiosClient";

const userApi = {
    create: (data) => {
        return axiosClient.post("/users", data);
    },
    getUsers: (params = {}) => {
        return axiosClient.get("/users", { params });
    },
    getUserById: (id) => {
        return axiosClient.get(`/users/${id}`);
    },
    toggleUserStatus: (id) => {
        return axiosClient.patch(`/users/${id}/toggle-status`);
    },
    updateUser: (id, data) => {
        return axiosClient.patch(`/users/${id}`, data);
    },
    getMyProfile: () => {
        return axiosClient.get("/users/me");
    },
    updateMyProfile: (data) => {
        return axiosClient.patch("/users/me", data);
    },
    updateMyAvatar: (avatarFile) => {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        return axiosClient.patch("/users/me/avatar", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    },
    deleteMyAvatar: () => {
        return axiosClient.delete("/users/me/avatar");
    }
}

export default userApi;