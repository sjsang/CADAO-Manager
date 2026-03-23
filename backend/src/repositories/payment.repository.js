const db = require('../config/db');

const VALID_PAYMENT_METHODS = new Set(['cash', 'transfer']);

const getPaymentByOrderId = async (orderId) => {
    const query = `SELECT * FROM payments WHERE order_id = $1`;
    const result = await db.query(query, [orderId]);
    return result.rows[0];
};

const createPayment = async (orderId, method, amount) => {
    if (!VALID_PAYMENT_METHODS.has(method)) {
        throw new Error('INVALID_PAYMENT_METHOD');
    }

    const query = `INSERT INTO payments (order_id, method, amount) VALUES ($1, $2, $3) RETURNING *`;
    const values = [orderId, method, amount];
    const result = await db.query(query, values);
    return result.rows[0];
};

const markCashPaymentPaid = async (orderId, client = db) => {
    const result = await client.query(
        `
            UPDATE payments
            SET payment_status = 'paid',
                paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)
            WHERE order_id = $1
              AND method = 'cash'
            RETURNING *
        `,
        [orderId]
    );

    return result.rows[0] || null;
};

const markOrderPaymentFailed = async (orderId, client = db) => {
    const result = await client.query(
        `
            UPDATE payments
            SET payment_status = 'failed',
                paid_at = NULL
            WHERE order_id = $1
            RETURNING *
        `,
        [orderId]
    );

    return result.rows[0] || null;
};

module.exports = {
    getPaymentByOrderId,
    createPayment,
    markCashPaymentPaid,
    markOrderPaymentFailed
};