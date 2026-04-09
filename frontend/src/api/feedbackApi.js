import axiosClient from './axiosClient';

const feedbackApi = {
    create: (data) => axiosClient.post('/feedbacks', data),
    getAll: (params = {}) => axiosClient.get('/feedbacks', { params }),
    toggleRead: (id) => axiosClient.patch(`/feedbacks/${id}/read`),
    delete: (id) => axiosClient.delete(`/feedbacks/${id}`)
};

export default feedbackApi;
