const customerRepository = require('../repositories/customer.repository');

const updateCustomer = async (req, res) => {
    try {
        const id = req.user.id;
        const { name, email, phone } = req.body;
        const data = await customerRepository.updateCustomer(id, name, email, phone);
        res.json(data);
    }
    catch (error) {
        console.error("Error updating customer:", error);
        res.status(500).json({ error: "An error occurred while updating the customer." });
    }
};

module.exports = {
    updateCustomer
};