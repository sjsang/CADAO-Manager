import axiosClient from './axiosClient';

const menuTypeApi = {
    getAll: () => axiosClient.get('/menu-types'),
};

export default menuTypeApi;