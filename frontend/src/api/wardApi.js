import axiosClient from "./axiosClient";

const wardApi = {
    getWards: (params = {}) => axiosClient.get("/wards", { params }),
    createWard: (payload) => axiosClient.post("/wards", payload),
    updateWard: (id, payload) => axiosClient.put(`/wards/${id}`, payload),
    deleteWard: (id) => axiosClient.delete(`/wards/${id}`)
};

export default wardApi;