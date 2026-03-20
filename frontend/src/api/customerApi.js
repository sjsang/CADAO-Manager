import axiosClient from './axiosClient';

const customerApi = {
    getCustomers: () => {
        const url = '/customers';
        return axiosClient.get(url);
    },
    update: (data) => {
        const url = '/customers/me';
        return axiosClient.put(url, data);
    }
}

export default customerApi;