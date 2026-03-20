const customerRepository = require('../repositories/customer.repository');

const getCustomers = async () => {
    return await customerRepository.getCustomers();
};

const updateCustomer = async (id, name, email, phone) => {
    return await customerRepository.updateCustomer(id, name, email, phone);
};

module.exports = {
    getCustomers,
    updateCustomer
};