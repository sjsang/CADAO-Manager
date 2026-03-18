const db = require("../config/db");

const getMenuTypes = async () => {
    let query = `SELECT * FROM menu_types`;
    const values = [];
    const result = await db.query(query, values);
    return result.rows;
};

module.exports = {
    getMenuTypes
};