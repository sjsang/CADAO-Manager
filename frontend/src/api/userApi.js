import axiosClient from "./axiosClient";

const userApi = {
    create: (data) => {
        return axiosClient.post("/users", data);
    },
    getUsers: () => {
        return axiosClient.get("/users");
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
    }
}

export default userApi;