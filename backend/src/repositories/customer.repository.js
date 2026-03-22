const db = require("../config/db");

const getCustomers = async () => {
    const query = `
        SELECT id, full_name, phone_number, email, is_active, created_at
        FROM customers
        ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
};

const createCustomerByAdmin = async (customerData) => {
    const { full_name, phone_number, email, password_hash } = customerData;
    const query = `
        INSERT INTO customers (full_name, phone_number, email, password_hash)
        VALUES ($1, $2, NULLIF($3, ''), $4)
        RETURNING id, full_name, phone_number, email, is_active, created_at
    `;
    const result = await db.query(query, [full_name, phone_number, email || '', password_hash]);
    return result.rows[0];
};

const updateCustomer = async (id, name, email, phone) => {
    const query = `UPDATE customers SET full_name = $1, email = $2, phone_number = $3 WHERE id = $4 RETURNING *`;
    const values = [name, email, phone, id];
    const result = await db.query(query, values);
    return result.rows[0];
};

// Address Management
const getCustomerAddresses = async (customerId) => {
    const query = `
        SELECT ca.id, ca.address_line, w.id as ward_id, w.name as ward_name, w.shipping_fee, ca.is_default, ca.created_at
        FROM customer_addresses ca
        JOIN wards w ON ca.ward_id = w.id
        WHERE ca.customer_id = $1
        ORDER BY ca.is_default DESC, ca.created_at DESC
    `;
    const result = await db.query(query, [customerId]);
    return result.rows;
};

const addCustomerAddress = async (customerId, addressLine, wardId) => {
    const query = `
        INSERT INTO customer_addresses (customer_id, address_line, ward_id, is_default)
        VALUES ($1, $2, $3, (SELECT COUNT(*) = 0 FROM customer_addresses WHERE customer_id = $1))
        RETURNING id, address_line, ward_id, is_default, created_at
    `;
    const result = await db.query(query, [customerId, addressLine, wardId]);
    return result.rows[0];
};

const updateCustomerAddress = async (addressId, addressLine, wardId) => {
    const query = `
        UPDATE customer_addresses 
        SET address_line = $1, ward_id = $2
        WHERE id = $3
        RETURNING id, address_line, ward_id, is_default, created_at
    `;
    const result = await db.query(query, [addressLine, wardId, addressId]);
    return result.rows[0];
};

const deleteCustomerAddress = async (addressId) => {
    const query = `DELETE FROM customer_addresses WHERE id = $1`;
    await db.query(query, [addressId]);
};

const setDefaultAddress = async (customerId, addressId) => {
    // Update all addresses to not default
    await db.query(
        `UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1`,
        [customerId]
    );

    // Set the selected address as default
    const query = `
        UPDATE customer_addresses 
        SET is_default = TRUE
        WHERE id = $1 AND customer_id = $2
        RETURNING id, address_line, ward_id, is_default, created_at
    `;
    const result = await db.query(query, [addressId, customerId]);
    return result.rows[0];
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

const toggleCustomerStatus = async (id) => {
    const query = `
        UPDATE customers
        SET is_active = NOT is_active
        WHERE id = $1
        RETURNING id, full_name, phone_number, email, is_active, created_at
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

const getCustomerOrders = async (customerId) => {
    const query = `
        SELECT order_code, delivery_full_name, delivery_phone, delivery_address,
               total_amount, status, created_at
        FROM orders
        WHERE customer_id = $1 AND status != 'cart'
        ORDER BY created_at DESC
    `;
    const result = await db.query(query, [customerId]);
    return result.rows;
};

const getCustomerAddressesByAdmin = async (customerId) => {
    const query = `
        SELECT ca.id, ca.address_line, w.name as ward_name, w.shipping_fee, ca.is_default, ca.created_at
        FROM customer_addresses ca
        JOIN wards w ON ca.ward_id = w.id
        WHERE ca.customer_id = $1
        ORDER BY ca.is_default DESC, ca.created_at DESC
    `;
    const result = await db.query(query, [customerId]);
    return result.rows;
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