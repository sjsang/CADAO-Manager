const db = require("../config/db");

const getAdminUser = async () => {
    const result = await db.query(
        `
            SELECT id, full_name, username
            FROM users
            WHERE role = 'admin' AND is_active = TRUE
            ORDER BY id ASC
            LIMIT 1
        `
    );

    return result.rows[0] || null;
};

const getConversationByCustomerId = async (customerId) => {
    const result = await db.query(
        `
            SELECT *
            FROM chat_conversations
            WHERE customer_id = $1
            LIMIT 1
        `,
        [customerId]
    );

    return result.rows[0] || null;
};

const createConversation = async (customerId, adminUserId) => {
    const result = await db.query(
        `
            INSERT INTO chat_conversations (customer_id, admin_user_id)
            VALUES ($1, $2)
            RETURNING *
        `,
        [customerId, adminUserId]
    );

    return result.rows[0];
};

const getConversationById = async (conversationId) => {
    const result = await db.query(
        `
            SELECT cc.*, c.full_name AS customer_name, c.email AS customer_email, c.phone_number AS customer_phone
            FROM chat_conversations cc
            JOIN customers c ON c.id = cc.customer_id
            WHERE cc.id = $1
            LIMIT 1
        `,
        [conversationId]
    );

    return result.rows[0] || null;
};

const createMessage = async ({
    conversationId,
    senderType,
    senderCustomerId = null,
    senderUserId = null,
    text
}) => {
    const isReadByCustomer = senderType === "customer";
    const isReadByAdmin = senderType === "admin" || senderType === "bot";

    const result = await db.query(
        `
            INSERT INTO chat_messages (
                conversation_id,
                sender_type,
                sender_customer_id,
                sender_user_id,
                text,
                is_read_by_customer,
                is_read_by_admin
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `,
        [conversationId, senderType, senderCustomerId, senderUserId, text, isReadByCustomer, isReadByAdmin]
    );

    await db.query(
        `
            UPDATE chat_conversations
            SET last_message = $1,
                updated_at = NOW()
            WHERE id = $2
        `,
        [text, conversationId]
    );

    return result.rows[0];
};

const setBotActiveStatus = async (conversationId, isBotActive) => {
    const result = await db.query(
        `
            UPDATE chat_conversations
            SET is_bot_active = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `,
        [isBotActive, conversationId]
    );

    return result.rows[0] || null;
};

const getMessagesByConversationId = async (conversationId) => {
    const result = await db.query(
        `
            SELECT
                cm.*,
                CASE
                    WHEN cm.sender_type = 'customer' THEN c.full_name
                    ELSE u.full_name
                END AS sender_name
            FROM chat_messages cm
            LEFT JOIN customers c ON c.id = cm.sender_customer_id
            LEFT JOIN users u ON u.id = cm.sender_user_id
            WHERE cm.conversation_id = $1
            ORDER BY cm.created_at ASC, cm.id ASC
        `,
        [conversationId]
    );

    return result.rows;
};

const getRecentMessages = async (conversationId, limit = 6) => {
    const result = await db.query(
        `
            SELECT id, sender_type, text, created_at
            FROM chat_messages
            WHERE conversation_id = $1
            ORDER BY created_at DESC, id DESC
            LIMIT $2
        `,
        [conversationId, limit]
    );

    return result.rows.reverse();
};

const markMessagesAsRead = async (conversationId, byRole) => {
    const readColumn = byRole === "admin" ? "is_read_by_admin" : "is_read_by_customer";
    const senderFilter = byRole === "admin"
        ? `sender_type = 'customer'`
        : `sender_type IN ('admin', 'bot')`;

    await db.query(
        `
            UPDATE chat_messages
            SET ${readColumn} = TRUE
            WHERE conversation_id = $1
              AND ${senderFilter}
              AND ${readColumn} = FALSE
        `,
        [conversationId]
    );
};

const getUnreadCount = async ({ userId, role }) => {
    if (role === "admin") {
        const result = await db.query(
            `
                SELECT COUNT(*)::int AS unread_count
                FROM chat_messages
                WHERE sender_type = 'customer'
                  AND is_read_by_admin = FALSE
            `
        );

        return result.rows[0]?.unread_count || 0;
    }

    const result = await db.query(
        `
            SELECT COUNT(*)::int AS unread_count
            FROM chat_messages cm
            JOIN chat_conversations cc ON cc.id = cm.conversation_id
            WHERE cc.customer_id = $1
              AND cm.sender_type IN ('admin', 'bot')
              AND cm.is_read_by_customer = FALSE
        `,
        [userId]
    );

    return result.rows[0]?.unread_count || 0;
};

const getConversationsForAdmin = async () => {
    const result = await db.query(
        `
            SELECT
                cc.*,
                c.full_name AS customer_name,
                c.email AS customer_email,
                c.phone_number AS customer_phone,
                COALESCE(
                    COUNT(*) FILTER (
                        WHERE cm.sender_type = 'customer'
                          AND cm.is_read_by_admin = FALSE
                    ),
                    0
                )::int AS unread_count
            FROM chat_conversations cc
            JOIN customers c ON c.id = cc.customer_id
            LEFT JOIN chat_messages cm ON cm.conversation_id = cc.id
            GROUP BY cc.id, c.id
            ORDER BY cc.updated_at DESC, cc.id DESC
        `
    );

    return result.rows;
};

const getConversationsForCustomer = async (customerId) => {
    const result = await db.query(
        `
            SELECT
                cc.*,
                u.full_name AS admin_name,
                COALESCE(
                    COUNT(*) FILTER (
                        WHERE cm.sender_type IN ('admin', 'bot')
                          AND cm.is_read_by_customer = FALSE
                    ),
                    0
                )::int AS unread_count
            FROM chat_conversations cc
            LEFT JOIN users u ON u.id = cc.admin_user_id
            LEFT JOIN chat_messages cm ON cm.conversation_id = cc.id
            WHERE cc.customer_id = $1
            GROUP BY cc.id, u.id
            ORDER BY cc.updated_at DESC, cc.id DESC
        `,
        [customerId]
    );

    return result.rows;
};

const searchMenuItems = async (query, limit = 5) => {
    const result = await db.query(
        `
            SELECT
                mi.id,
                mi.name,
                mi.description,
                mi.price,
                mi.sold_count,
                mi.is_available,
                c.name AS category_name,
                mt.name AS menu_type_name
            FROM menu_items mi
            JOIN categories c ON c.id = mi.category_id
            JOIN menu_types mt ON mt.id = c.menu_type_id
            WHERE mi.name ILIKE $1
               OR COALESCE(mi.description, '') ILIKE $1
               OR c.name ILIKE $1
               OR mt.name ILIKE $1
            ORDER BY mi.is_available DESC, mi.sold_count DESC, mi.name ASC
            LIMIT $2
        `,
        [`%${query}%`, limit]
    );

    return result.rows;
};

const getMenuItemsByPrice = async ({ sort = "asc", limit = 1 } = {}) => {
    const safeSort = sort === "desc" ? "DESC" : "ASC";
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 10) : 1;

    const result = await db.query(
        `
            SELECT
                mi.id,
                mi.name,
                mi.price,
                mi.sold_count,
                mi.is_available,
                c.name AS category_name,
                mt.name AS menu_type_name
            FROM menu_items mi
            JOIN categories c ON c.id = mi.category_id
            JOIN menu_types mt ON mt.id = c.menu_type_id
            WHERE mi.is_available = TRUE
            ORDER BY mi.price ${safeSort}, mi.name ASC
            LIMIT $1
        `,
        [safeLimit]
    );

    return result.rows;
};

const getActiveVouchers = async () => {
    const result = await db.query(
        `
            SELECT
                id,
                code,
                discount_percent,
                discount_amount,
                min_order_value,
                max_discount,
                usage_limit,
                used_count,
                expiry_date,
                is_active
            FROM vouchers
            WHERE is_active = TRUE
              AND (expiry_date IS NULL OR expiry_date >= NOW())
            ORDER BY created_at DESC, id DESC
            LIMIT 20
        `
    );

    return result.rows;
};

module.exports = {
    getAdminUser,
    getConversationByCustomerId,
    createConversation,
    getConversationById,
    createMessage,
    setBotActiveStatus,
    getMessagesByConversationId,
    getRecentMessages,
    markMessagesAsRead,
    getUnreadCount,
    getConversationsForAdmin,
    getConversationsForCustomer,
    searchMenuItems,
    getMenuItemsByPrice,
    getActiveVouchers
};
