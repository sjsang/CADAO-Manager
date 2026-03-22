const db = require("../config/db");

const getMenuItems = async ({ type, category, search, sort, available, page, limit } = {}) => {

    let query = `
        SELECT menu_items.*
        FROM menu_items
        JOIN categories ON menu_items.category_id = categories.id
        JOIN menu_types ON categories.menu_type_id = menu_types.id
    `;

    const conditions = [];
    const values = [];

    if (type) {
        values.push(type);
        conditions.push(`menu_types.name = $${values.length}`);
    }

    if (category) {
        values.push(category);
        conditions.push(`categories.name = $${values.length}`);
    }

    if (search) {
        values.push(`%${search}%`);
        conditions.push(`menu_items.name ILIKE $${values.length}`);
    }

    if (available !== null && available !== undefined) {
        values.push(available);
        conditions.push(`menu_items.is_available = $${values.length}`);
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(" AND ");
    }

    switch (sort) {
        case "price_asc":
            query += ` ORDER BY menu_items.price ASC`;
            break;
        case "price_desc":
            query += ` ORDER BY menu_items.price DESC`;
            break;
        case "name_desc":
            query += ` ORDER BY menu_items.name DESC`;
            break;
        default:
            query += ` ORDER BY menu_items.name ASC`;
    }

    const hasPagination = page !== undefined || limit !== undefined;
    if (!hasPagination) {
        const result = await db.query(query, values);
        return result.rows;
    }

    const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 100) : 5;
    const offset = (safePage - 1) * safeLimit;

    const countQuery = `SELECT COUNT(*)::int AS total FROM (${query}) AS filtered_menu_items`;
    const countResult = await db.query(countQuery, values);
    const totalItems = countResult.rows[0]?.total || 0;

    const paginatedValues = [...values, safeLimit, offset];
    const paginatedQuery = `${query} LIMIT $${paginatedValues.length - 1} OFFSET $${paginatedValues.length}`;
    const result = await db.query(paginatedQuery, paginatedValues);

    return {
        data: result.rows,
        pagination: {
            page: safePage,
            limit: safeLimit,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / safeLimit))
        }
    };
};

const getMenuItemById = async (id) => {
    const query = `
        SELECT menu_items.*
        FROM menu_items
        WHERE menu_items.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
}

const createMenuItem = async (name, description, price, categoryId, imageUrl, isAvailable) => {
    const query = `
        INSERT INTO menu_items (name, description, price, category_id, image_url, is_available)
        VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE))
        RETURNING *
    `;
    const result = await db.query(query, [name, description, price, categoryId, imageUrl, isAvailable]);
    return result.rows[0];
};

const updateMenuItem = async (id, name, description, price, categoryId, imageUrl, isAvailable) => {
    const query = `
        UPDATE menu_items
        SET 
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            price = COALESCE($3, price),
            category_id = COALESCE($4, category_id),
            image_url = COALESCE($5, image_url),
            is_available = COALESCE($6, is_available)
        WHERE id = $7
        RETURNING *
    `;
    const result = await db.query(query, [name, description, price, categoryId, imageUrl, isAvailable, id]);
    return result.rows[0];
};

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem
};