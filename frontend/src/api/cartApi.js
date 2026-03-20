import axiosClient from "./axiosClient";

const cartApi = {
    getAll: () => {
        const url = "/cart-items";
        return axiosClient.get(url);
    },
    addToCart: (data) => {
        const url = "/cart-items";
        return axiosClient.post(url, data);
    },
    updateCartItem: (menuItemId, data) => {
        const url = `/cart-items/${menuItemId}`;
        return axiosClient.patch(url, data);
    },
    deleteCartItem: (menuItemId) => {
        const url = `/cart-items/${menuItemId}`;
        return axiosClient.delete(url);
    },
    deleteAllCartItems: () => {
        const url = "/cart-items";
        return axiosClient.delete(url);
    }
}

export default cartApi;