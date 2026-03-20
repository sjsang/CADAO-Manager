import axiosClient from "./axiosClient";

const userApi = {
    getUsers: () => {
        return axiosClient.get("/users");
    }
}

export default userApi;