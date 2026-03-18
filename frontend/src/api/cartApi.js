import axiosClient from "./axiosClient";

const cartApi = {
    getAll: () => {
        const url = "/cart";
        return axiosClient.get(url);
    },
    addToCart: (data) => {
        const url = "/cart";
        return axiosClient.post(url, data);
    },
    updateCartItem: (data) => {
        const url = "/cart";
        return axiosClient.put(url, data);
    },
    deleteCartItem: (data) => {
        const url = "/cart";
        return axiosClient.delete(url, { data });
    },
    deleteAllCartItems: () => {
        const url = "/cart/all";
        return axiosClient.delete(url);
    }
}

export default cartApi;