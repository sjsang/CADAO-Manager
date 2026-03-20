const db = require("../config/db");

const getUsers = async () => {
    const query = `
        SELECT id, username, full_name, phone_number, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
};

module.exports = {
    getUsers
};