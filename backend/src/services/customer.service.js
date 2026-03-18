const customerRepository = require('../repositories/customer.repository');

const updateCustomer = async (id, name, email, phone) => {
    return await customerRepository.updateCustomer(id, name, email, phone);
};

module.exports = {
    updateCustomer
};