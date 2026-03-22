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
    }
}

export default userApi;