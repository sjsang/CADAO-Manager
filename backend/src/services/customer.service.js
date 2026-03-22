const customerRepository = require('../repositories/customer.repository');

const getCustomers = async () => {
    return await customerRepository.getCustomers();
};

const updateCustomer = async (id, name, email, phone) => {
    return await customerRepository.updateCustomer(id, name, email, phone);
};

// Address Management
const getCustomerAddresses = async (customerId) => {
    return await customerRepository.getCustomerAddresses(customerId);
};

const addCustomerAddress = async (customerId, addressLine, wardId) => {
    return await customerRepository.addCustomerAddress(customerId, addressLine, wardId);
};

const updateCustomerAddress = async (addressId, addressLine, wardId) => {
    return await customerRepository.updateCustomerAddress(addressId, addressLine, wardId);
};

const deleteCustomerAddress = async (addressId) => {
    return await customerRepository.deleteCustomerAddress(addressId);
};

const setDefaultAddress = async (customerId, addressId) => {
    return await customerRepository.setDefaultAddress(customerId, addressId);
};

module.exports = {
    getCustomers,
    updateCustomer,
    getCustomerAddresses,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    setDefaultAddress
};