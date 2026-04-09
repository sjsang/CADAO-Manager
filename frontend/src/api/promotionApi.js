import axiosClient from './axiosClient';

const promotionApi = {
    getAll: (params = {}) => {
        return axiosClient.get('/promotions', { params });
    },
    getById: (id) => {
        const url = `/promotions/${id}`;
        return axiosClient.get(url);
    },
    create: (data, imageFile) => {
        const formData = new FormData();
        for (const key of Object.keys(data)) {
            const val = data[key];
            if (Array.isArray(val)) {
                formData.append(key, JSON.stringify(val));
            } else if (val !== null && val !== undefined) {
                formData.append(key, val);
            }
        }
        if (imageFile) formData.append('image', imageFile);
        return axiosClient.post('/promotions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    update: (id, data, imageFile) => {
        const formData = new FormData();
        for (const key of Object.keys(data)) {
            const val = data[key];
            if (Array.isArray(val)) {
                formData.append(key, JSON.stringify(val));
            } else if (val !== null && val !== undefined) {
                formData.append(key, val);
            }
        }
        if (imageFile) formData.append('image', imageFile);
        return axiosClient.put(`/promotions/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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