const db = require("../config/db");

const registerCustomer = async (customerData) => {
    const { full_name, phone_number, email, password_hash } = customerData;
    const query = `INSERT INTO customers (full_name, phone_number, email, password_hash)
                   VALUES ($1, $2, $3, $4) RETURNING id`;
    const result = await db.query(query, [full_name, phone_number, email, password_hash]);
    return result.rows[0].id;
};

const loginCustomer = async (email) => {
    const query = `SELECT * FROM customers WHERE email = $1 AND is_active = TRUE`;
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
};

const getCustomerById = async (id) => {
    const query = `
        SELECT id, full_name, phone_number, email, is_active, created_at
        FROM customers
        WHERE id = $1
    `;

    const result = await db.query(query, [id]);

    return result.rows[0] || null;
};

module.exports = {
    registerCustomer,
    loginCustomer,
    getCustomerById
};