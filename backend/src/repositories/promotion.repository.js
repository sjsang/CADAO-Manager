const db = require('../config/db');

// lấy tất cả khuyến mãi kèm phạm vi áp dụng
const getPromotions = async () => {
    const query = `
        SELECT p.*,
            COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', mt.id, 'name', mt.name))
                FILTER (WHERE mt.id IS NOT NULL), '[]'
            ) AS menu_types,
            COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name))
                FILTER (WHERE c.id IS NOT NULL), '[]'
            ) AS categories,
            COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', mi.id, 'name', mi.name))
                FILTER (WHERE mi.id IS NOT NULL), '[]'
            ) AS menu_items
        FROM promotions p
        LEFT JOIN promotion_menu_types pmt ON p.id = pmt.promotion_id
        LEFT JOIN menu_types mt ON pmt.menu_type_id = mt.id
        LEFT JOIN promotion_categories pc ON p.id = pc.promotion_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN promotion_menu_items pmi ON p.id = pmi.promotion_id
        LEFT JOIN menu_items mi ON pmi.menu_item_id = mi.id
        GROUP BY p.id
        ORDER BY p.priority DESC, p.start_time DESC
    `;
    const { rows } = await db.query(query);
    return rows;
};

const getPromotionById = async (id) => {
    const query = `
        SELECT *
        FROM promotions
        WHERE id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

const createPromotion = async (promotionData) => {
    try {
        await db.query("BEGIN");

        const {
            name,
            description,
            discount_percent,
            discount_amount,
            start_time,
            end_time,
            priority,
            menu_type_ids = [],
            category_ids = [],
            menu_item_ids = []
        } = promotionData;

        const promotionQuery = `
            INSERT INTO promotions
            (name, description, discount_percent, discount_amount, start_time, end_time, priority)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING id
        `;

        const { rows } = await db.query(promotionQuery, [
            name,
            description,
            discount_percent,
            discount_amount,
            start_time,
            end_time,
            priority
        ]);

        const promotionId = rows[0].id;

        for (const menuTypeId of menu_type_ids) {
            await db.query(
                `INSERT INTO promotion_menu_types (promotion_id, menu_type_id)
                 VALUES ($1,$2)`,
                [promotionId, menuTypeId]
            );
        }

        for (const categoryId of category_ids) {
            await db.query(
                `INSERT INTO promotion_categories (promotion_id, category_id)
                 VALUES ($1,$2)`,
                [promotionId, categoryId]
            );
        }

        for (const menuItemId of menu_item_ids) {
            await db.query(
                `INSERT INTO promotion_menu_items (promotion_id, menu_item_id)
                 VALUES ($1,$2)`,
                [promotionId, menuItemId]
            );
        }

        await db.query("COMMIT");

        return { id: promotionId };

    } catch (error) {
        await db.query("ROLLBACK");
        throw error;
    }
};

module.exports = {
    getPromotions,
    getPromotionById,
    createPromotion
};