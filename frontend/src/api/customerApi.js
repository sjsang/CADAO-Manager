import axiosClient from './axiosClient';

const customerApi = {
    getCustomers: () => {
        const url = '/customers';
        return axiosClient.get(url);
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
    }
}

export default customerApi;