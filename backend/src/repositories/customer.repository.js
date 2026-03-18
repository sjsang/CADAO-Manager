const db = require("../config/db");

const updateCustomer = async (id, name, email, phone) => {
    const query = `UPDATE customers SET full_name = $1, email = $2, phone_number = $3 WHERE id = $4 RETURNING *`;
    const values = [name, email, phone, id];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = {
    updateCustomer
};