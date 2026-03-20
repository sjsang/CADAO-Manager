import axiosClient from './axiosClient';

const authApi = {
    register: (data) => {
        const url = '/auth/customers';
        return axiosClient.post(url, data);
    },
    login: (data) => {
        const url = '/auth/sessions';
        return axiosClient.post(url, data);
    },
    logout: () => {
        const url = '/auth/sessions/current';
        return axiosClient.delete(url);
    },
    me: () => {
        const url = '/auth/sessions/current';
        return axiosClient.get(url);
    },
    adminLogin: (data) => {
        const url = '/auth/admin/sessions';
        return axiosClient.post(url, data);
    }
}

export default authApi;