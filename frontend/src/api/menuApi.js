import axiosClient from './axiosClient';

const menuApi = {
    getAll: (params) => axiosClient.get('/menu', {
        params
    }),
};

export default menuApi;