const db = require("../config/db");

const getCategories = async (type) => {
    let query = `
        SELECT categories.*
        FROM categories
        JOIN menu_types ON categories.menu_type_id = menu_types.id
    `;
    const values = [];

    if (type) {
        values.push(type);
        query += ` WHERE menu_types.name = $${values.length}`;
    }
    query += ` ORDER BY categories.menu_type_id ASC, categories.name ASC`;
    const result = await db.query(query, values);
    return result.rows;
};

module.exports = {
    getCategories
};