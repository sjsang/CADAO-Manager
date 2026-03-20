import axiosClient from './axiosClient';

const menuApi = {
    getAll: (params) => axiosClient.get('/menus', {
        params
    }),
};

export default menuApi;