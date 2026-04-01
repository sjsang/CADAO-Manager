import axiosClient from './axiosClient';

const promotionApi = {
    getAll: () => {
        const url = '/promotions';
        return axiosClient.get(url);
    },
    getById: (id) => {
        const url = `/promotions/${id}`;
        return axiosClient.get(url);
    },
    create: (data) => {
        const url = '/promotions';
        return axiosClient.post(url, data);
    },
    update: (id, data) => {
        const url = `/promotions/${id}`;
        return axiosClient.put(url, data);
    },
    delete: (id) => {
        const url = `/promotions/${id}`;
        return axiosClient.delete(url);
    },
    toggle: (id) => {
        const url = `/promotions/${id}/toggle`;
        return axiosClient.patch(url);
    },
    getActiveForItems: (menuItemIds) => {
        const url = '/promotions/active-for-items';
        return axiosClient.post(url, { menu_item_ids: menuItemIds });
    },
};

export default promotionApi;