const customerRepository = require('../repositories/customer.repository');
const bcrypt = require('bcrypt');

const getCustomers = async () => {
    return await customerRepository.getCustomers();
};

const createCustomerByAdmin = async (customerData) => {
    const password_hash = await bcrypt.hash(customerData.password, 10);
    return await customerRepository.createCustomerByAdmin({
        ...customerData,
        password_hash
    });
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

const getCustomerById = async (id) => {
    return await customerRepository.getCustomerById(id);
};

const toggleCustomerStatus = async (id) => {
    return await customerRepository.toggleCustomerStatus(id);
};

const getCustomerOrders = async (customerId) => {
    return await customerRepository.getCustomerOrders(customerId);
};

const getCustomerAddressesByAdmin = async (customerId) => {
    return await customerRepository.getCustomerAddressesByAdmin(customerId);
};

module.exports = {
    getCustomers,
    createCustomerByAdmin,
    updateCustomer,
    getCustomerAddresses,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    setDefaultAddress,
    getCustomerById,
    toggleCustomerStatus,
    getCustomerOrders,
    getCustomerAddressesByAdmin
};