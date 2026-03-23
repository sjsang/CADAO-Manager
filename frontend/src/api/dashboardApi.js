import axiosClient from './axiosClient';

const dashboardApi = {
    getOverview: () => axiosClient.get('/dashboard/overview'),
    getStatistics: (params = {}) => axiosClient.get('/dashboard/statistics', { params })
};

export default dashboardApi;