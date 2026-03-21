import axiosClient from './axiosClient';

const menuApi = {
    getAll: (params) => axiosClient.get('/menus', {
        params
    }),
    getById: (id) => axiosClient.get(`/menus/${id}`),
    create: (formData) => axiosClient.post('/menus', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    update: (id, formData) => axiosClient.put(`/menus/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
};

export default menuApi;