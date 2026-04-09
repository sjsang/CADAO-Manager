import axiosClient from './axiosClient';

const customerApi = {
    create: (data) => {
        const url = '/customers';
        return axiosClient.post(url, data);
    },
    getCustomers: (params = {}) => {
        const url = '/customers';
        return axiosClient.get(url, { params });
    },
    update: (data) => {
        const url = '/customers/me';
        return axiosClient.put(url, data);
    },
    updateAvatar: (avatarFile) => {
        const url = '/customers/me/avatar';
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        return axiosClient.patch(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    // Address Management
    getAddresses: () => {
        const url = '/customers/addresses';
        return axiosClient.get(url);
    },
    addAddress: (data) => {
        const url = '/customers/addresses';
        return axiosClient.post(url, data);
    },
    updateAddress: (id, data) => {
        const url = `/customers/addresses/${id}`;
        return axiosClient.put(url, data);
    },
    deleteAddress: (id) => {
        const url = `/customers/addresses/${id}`;
        return axiosClient.delete(url);
    },
    setDefaultAddress: (addressId) => {
        const url = '/customers/addresses/set-default';
        return axiosClient.post(url, { addressId });
    },
    getCustomerById: (id) => {
        return axiosClient.get(`/customers/${id}`);
    },
    toggleCustomerStatus: (id) => {
        return axiosClient.patch(`/customers/${id}/toggle-status`);
    },
    updateCustomerByAdmin: (id, data) => {
        return axiosClient.patch(`/customers/${id}`, data);
    },
    getMyRank: () => {
        return axiosClient.get('/customers/me/rank');
    }
}

export default customerApi;