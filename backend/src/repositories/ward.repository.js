const db = require("../config/db");

const getWards = async (search) => {
    const values = [];
    let query = `
        SELECT id, name, shipping_fee
        FROM wards
    `;

    if (search) {
        values.push(`%${search}%`);
        query += ` WHERE name ILIKE $${values.length}`;
    }

    query += ` ORDER BY name ASC`;

    const result = await db.query(query, values);
    return result.rows;
};

const createWard = async (name, shippingFee) => {
    const result = await db.query(
        `
            INSERT INTO wards (name, shipping_fee)
            VALUES ($1, $2)
            RETURNING id, name, shipping_fee
        `,
        [name, shippingFee]
    );

    return result.rows[0];
};

const updateWard = async (id, name, shippingFee) => {
    const result = await db.query(
        `
            UPDATE wards
            SET name = $1, shipping_fee = $2
            WHERE id = $3
            RETURNING id, name, shipping_fee
        `,
        [name, shippingFee, id]
    );

    return result.rows[0] || null;
};

const deleteWard = async (id) => {
    const result = await db.query(
        `
            DELETE FROM wards
            WHERE id = $1
            RETURNING id, name, shipping_fee
        `,
        [id]
    );

    return result.rows[0] || null;
};

module.exports = {
    getWards,
    createWard,
    updateWard,
    deleteWard
};