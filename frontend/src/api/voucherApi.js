import axiosClient from "./axiosClient";

const voucherApi = {
    getVouchers: (params = {}) => axiosClient.get("/vouchers", { params }),
    validateForOrder: (payload) => axiosClient.post("/vouchers/validate", payload),
    createVoucher: (payload) => axiosClient.post("/vouchers", payload),
    updateVoucher: (id, payload) => axiosClient.put(`/vouchers/${id}`, payload),
    deleteVoucher: (id) => axiosClient.delete(`/vouchers/${id}`)
};

export default voucherApi;
