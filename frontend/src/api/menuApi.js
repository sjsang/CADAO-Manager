import axiosClient from './axiosClient';

const menuApi = {
    getAll: (type, category) => axiosClient.get('/menu', {
        params: { type, category }
    }),
};

export default menuApi;