const db = require('../config/db');

const getNotificationsByCustomerId = async (customerId, { page = 1, limit = 20 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    const countResult = await db.query(
        `SELECT COUNT(*)::int AS total FROM customer_notifications WHERE customer_id = $1`,
        [customerId]
    );
    const totalItems = countResult.rows[0]?.total || 0;

    const { rows } = await db.query(
        `SELECT id, type, title, message, link, is_read, created_at
         FROM customer_notifications
         WHERE customer_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [customerId, safeLimit, offset]
    );

    return {
        data: rows,
        pagination: {
            page: safePage,
            limit: safeLimit,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / safeLimit))
        }
    };
};

const getUnreadCount = async (customerId) => {
    const { rows } = await db.query(
        `SELECT COUNT(*)::int AS count FROM customer_notifications WHERE customer_id = $1 AND is_read = FALSE`,
        [customerId]
    );
    return rows[0]?.count || 0;
};

const markAsRead = async (notificationId, customerId) => {
    const { rowCount } = await db.query(
        `UPDATE customer_notifications SET is_read = TRUE WHERE id = $1 AND customer_id = $2`,
        [notificationId, customerId]
    );
    return rowCount > 0;
};

const markAllAsRead = async (customerId) => {
    await db.query(
        `UPDATE customer_notifications SET is_read = TRUE WHERE customer_id = $1 AND is_read = FALSE`,
        [customerId]
    );
};

const createNotification = async ({ customerId, type = 'general', title, message, link = null }) => {
    const { rows } = await db.query(
        `INSERT INTO customer_notifications (customer_id, type, title, message, link)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, type, title, message, link, is_read, created_at`,
        [customerId, type, title, message, link]
    );
    return rows[0];
};

const deleteNotification = async (notificationId, customerId) => {
    const { rowCount } = await db.query(
        `DELETE FROM customer_notifications WHERE id = $1 AND customer_id = $2`,
        [notificationId, customerId]
    );
    return rowCount > 0;
};

module.exports = {
    getNotificationsByCustomerId,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification
};
