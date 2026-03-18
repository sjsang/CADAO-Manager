const db = require('../config/db');

// CREATE TABLE payments (
//     id SERIAL PRIMARY KEY,
//     order_id INT NOT NULL UNIQUE
//         REFERENCES orders(id) ON DELETE CASCADE,

//     method VARCHAR(50)
//         CHECK (method IN ('cash', 'card', 'transfer', 'e-wallet')),

//     payment_status VARCHAR(20) DEFAULT 'pending'
//         CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

//     amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
//     transaction_code VARCHAR(100),

//     paid_at TIMESTAMP,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

const createPayment = async (orderId, method, amount) => {
    const query = `INSERT INTO payments (order_id, method, amount) VALUES ($1, $2, $3) RETURNING *`;
    const values = [orderId, method, amount];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = {
    createPayment
};