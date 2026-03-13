const db = require("../config/db");

const getMenuItems = async (type, category, search, sort) => {

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

    const result = await db.query(query, values);
    return result.rows;
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

const createMenuItem = async (name, description, price, categoryId, imageUrl) => {
    const query = `
        INSERT INTO menu_items (name, description, price, category_id, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const result = await db.query(query, [name, description, price, categoryId, imageUrl]);
    return result.rows[0];
};

const updateMenuItem = async (id, name, description, price, categoryId, imageUrl) => {
    const query = `
        UPDATE menu_items
        SET 
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            price = COALESCE($3, price),
            category_id = COALESCE($4, category_id),
            image_url = COALESCE($5, image_url)
        WHERE id = $6
        RETURNING *
    `;
    const result = await db.query(query, [name, description, price, categoryId, imageUrl, id]);
    return result.rows[0];
};

const deleteMenuItem = async (id) => {
    const query = `
        DELETE FROM menu_items
        WHERE id = $1
        RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
};