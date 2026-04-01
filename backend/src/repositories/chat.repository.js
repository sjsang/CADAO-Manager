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

// #1 - Lịch sử đơn hàng khách hàng (gợi ý cá nhân hóa)
const getCustomerOrderHistory = async (customerId, limit = 5) => {
    const result = await db.query(
        `
            SELECT
                o.order_code,
                o.status,
                o.total_amount,
                o.created_at,
                json_agg(json_build_object(
                    'name', mi.name,
                    'quantity', oi.quantity,
                    'price', oi.price
                ) ORDER BY oi.id) AS items
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN menu_items mi ON mi.id = oi.menu_item_id
            WHERE o.customer_id = $1
              AND o.status IN ('completed', 'shipping', 'preparing', 'confirmed')
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT $2
        `,
        [customerId, limit]
    );

    return result.rows;
};

// #6 - Theo dõi đơn hàng
const getCustomerActiveOrders = async (customerId) => {
    const result = await db.query(
        `
            SELECT
                o.order_code,
                o.status,
                o.total_amount,
                o.delivery_address,
                o.delivery_ward_name,
                o.shipping_fee,
                o.created_at,
                o.updated_at,
                u.full_name AS shipper_name,
                u.phone_number AS shipper_phone
            FROM orders o
            LEFT JOIN users u ON u.id = o.shipper_id
            WHERE o.customer_id = $1
              AND o.status IN ('pending', 'confirmed', 'preparing', 'shipping')
            ORDER BY o.updated_at DESC
            LIMIT 5
        `,
        [customerId]
    );

    return result.rows;
};

// #3 - Tìm menu item theo tên chính xác (cho add-to-cart)
const findMenuItemByName = async (name) => {
    const result = await db.query(
        `
            SELECT id, name, price, is_available, image_url
            FROM menu_items
            WHERE name ILIKE $1
            LIMIT 1
        `,
        [`%${name}%`]
    );

    return result.rows[0] || null;
};

// #7 - Tìm món kèm ảnh
const searchMenuItemsWithImage = async (query, limit = 5) => {
    const result = await db.query(
        `
            SELECT
                mi.id,
                mi.name,
                mi.description,
                mi.price,
                mi.sold_count,
                mi.is_available,
                mi.image_url,
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

// #5 - Đánh giá chatbot
const createChatRating = async ({ conversationId, customerId, rating, feedback }) => {
    const result = await db.query(
        `
            INSERT INTO chat_ratings (conversation_id, customer_id, rating, feedback)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (conversation_id, customer_id)
            DO UPDATE SET rating = EXCLUDED.rating, feedback = EXCLUDED.feedback, created_at = NOW()
            RETURNING *
        `,
        [conversationId, customerId, rating, feedback || null]
    );

    return result.rows[0];
};

const getChatRating = async (conversationId, customerId) => {
    const result = await db.query(
        `SELECT * FROM chat_ratings WHERE conversation_id = $1 AND customer_id = $2 LIMIT 1`,
        [conversationId, customerId]
    );

    return result.rows[0] || null;
};

// #9 - Dashboard thống kê chatbot
const getChatDashboardStats = async ({ fromDate, toDate } = {}) => {
    const dateFilter = fromDate && toDate
        ? `AND cm.created_at BETWEEN $1 AND $2`
        : "";
    const params = fromDate && toDate ? [fromDate, toDate] : [];

    const totalConversations = await db.query(
        `SELECT COUNT(*)::int AS total FROM chat_conversations`
    );

    const activeConversations = await db.query(
        `SELECT COUNT(*)::int AS total FROM chat_conversations WHERE is_bot_active = TRUE`
    );

    const messageStats = await db.query(
        `
            SELECT
                COUNT(*)::int AS total_messages,
                COUNT(*) FILTER (WHERE cm.sender_type = 'customer')::int AS customer_messages,
                COUNT(*) FILTER (WHERE cm.sender_type = 'bot')::int AS bot_messages,
                COUNT(*) FILTER (WHERE cm.sender_type = 'admin')::int AS admin_messages
            FROM chat_messages cm
            WHERE 1=1 ${dateFilter}
        `,
        params
    );

    const handoffCount = await db.query(
        `
            SELECT COUNT(*)::int AS total
            FROM chat_messages cm
            WHERE cm.text = 'Mình muốn được nhân viên tư vấn trực tiếp.'
              AND cm.sender_type = 'customer'
              ${dateFilter}
        `,
        params
    );

    const ratingStats = await db.query(
        `
            SELECT
                COUNT(*)::int AS total_ratings,
                ROUND(AVG(rating), 2) AS avg_rating,
                COUNT(*) FILTER (WHERE rating >= 4)::int AS positive_ratings,
                COUNT(*) FILTER (WHERE rating <= 2)::int AS negative_ratings
            FROM chat_ratings
        `
    );

    const dailyMessages = await db.query(
        `
            SELECT
                DATE(cm.created_at) AS date,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE cm.sender_type = 'customer')::int AS customer,
                COUNT(*) FILTER (WHERE cm.sender_type = 'bot')::int AS bot,
                COUNT(*) FILTER (WHERE cm.sender_type = 'admin')::int AS admin
            FROM chat_messages cm
            WHERE cm.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(cm.created_at)
            ORDER BY date ASC
        `
    );

    const topQuestions = await db.query(
        `
            SELECT
                cm.text,
                COUNT(*)::int AS count
            FROM chat_messages cm
            WHERE cm.sender_type = 'customer'
              AND LENGTH(cm.text) > 5
              AND cm.text != 'Mình muốn được nhân viên tư vấn trực tiếp.'
              AND cm.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY cm.text
            ORDER BY count DESC
            LIMIT 10
        `
    );

    const avgResponseTime = await db.query(
        `
            SELECT ROUND(AVG(EXTRACT(EPOCH FROM (bot_msg.created_at - cust_msg.created_at)))::numeric, 1) AS avg_seconds
            FROM chat_messages cust_msg
            JOIN LATERAL (
                SELECT created_at
                FROM chat_messages
                WHERE conversation_id = cust_msg.conversation_id
                  AND sender_type IN ('bot', 'admin')
                  AND created_at > cust_msg.created_at
                ORDER BY created_at ASC
                LIMIT 1
            ) bot_msg ON TRUE
            WHERE cust_msg.sender_type = 'customer'
              AND cust_msg.created_at >= NOW() - INTERVAL '30 days'
        `
    );

    const ratingDistribution = await db.query(
        `
            SELECT rating, COUNT(*)::int AS count
            FROM chat_ratings
            GROUP BY rating
            ORDER BY rating ASC
        `
    );

    return {
        totalConversations: totalConversations.rows[0]?.total || 0,
        activeConversations: activeConversations.rows[0]?.total || 0,
        ...messageStats.rows[0],
        handoffCount: handoffCount.rows[0]?.total || 0,
        ...ratingStats.rows[0],
        ratingDistribution: ratingDistribution.rows,
        dailyMessages: dailyMessages.rows,
        topQuestions: topQuestions.rows,
        avgResponseTimeSeconds: avgResponseTime.rows[0]?.avg_seconds || null
    };
};

// #10 - Tóm tắt hội thoại cho admin
const getConversationSummaryData = async (conversationId) => {
    const result = await db.query(
        `
            SELECT cm.sender_type, cm.text, cm.created_at
            FROM chat_messages cm
            WHERE cm.conversation_id = $1
            ORDER BY cm.created_at DESC
            LIMIT 20
        `,
        [conversationId]
    );

    return result.rows.reverse();
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
    getActiveVouchers,
    getCustomerOrderHistory,
    getCustomerActiveOrders,
    findMenuItemByName,
    searchMenuItemsWithImage,
    createChatRating,
    getChatRating,
    getChatDashboardStats,
    getConversationSummaryData
};
