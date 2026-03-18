import axiosClient from './axiosClient';

const customerApi = {
    update: (data) => {
        const url = '/customer/update';
        return axiosClient.put(url, data);
    }
}

export default customerApi;