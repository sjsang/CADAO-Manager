import axiosClient from './axiosClient';

const menuTypeApi = {
    getAll: () => axiosClient.get('/menu-type'),
};

export default menuTypeApi;