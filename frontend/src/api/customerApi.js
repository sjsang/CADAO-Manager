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
    }
}

export default customerApi;