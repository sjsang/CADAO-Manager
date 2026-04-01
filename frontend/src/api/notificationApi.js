import axiosClient from './axiosClient';

const notificationApi = {
    getAll: (params) => {
        const url = '/notifications';
        return axiosClient.get(url, { params });
    },
    getUnreadCount: () => {
        const url = '/notifications/unread-count';
        return axiosClient.get(url);
    },
    markAsRead: (id) => {
        const url = `/notifications/${id}/read`;
        return axiosClient.patch(url);
    },
    markAllAsRead: () => {
        const url = '/notifications/read-all';
        return axiosClient.patch(url);
    },
    delete: (id) => {
        const url = `/notifications/${id}`;
        return axiosClient.delete(url);
    },
};

export default notificationApi;
