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
};

export default promotionApi;