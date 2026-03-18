const db = require('../config/db');

const getPaymentByOrderId = async (orderId) => {
    const query = `SELECT * FROM payments WHERE order_id = $1`;
    const result = await db.query(query, [orderId]);
    return result.rows[0];
};

const createPayment = async (orderId, method, amount) => {
    const query = `INSERT INTO payments (order_id, method, amount) VALUES ($1, $2, $3) RETURNING *`;
    const values = [orderId, method, amount];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = {
    getPaymentByOrderId,
    createPayment
};