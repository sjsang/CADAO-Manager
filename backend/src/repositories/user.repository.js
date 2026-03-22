const db = require("../config/db");

const getUsers = async ({ search = "", role = "all", isActive = "all", sortBy = "created_at", sortDir = "desc" } = {}) => {
    const values = [];
    let query = `
        SELECT id, username, full_name, phone_number, role, is_active, created_at
        FROM users
    `;

    const conditions = [];

    if (search) {
        values.push(`%${search}%`);
        conditions.push(`(username ILIKE $${values.length} OR full_name ILIKE $${values.length} OR phone_number ILIKE $${values.length})`);
    }

    if (["admin", "staff", "shipper"].includes(role)) {
        values.push(role);
        conditions.push(`role = $${values.length}`);
    }

    if (isActive === "true" || isActive === "false") {
        values.push(isActive === "true");
        conditions.push(`is_active = $${values.length}`);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    const sortMap = {
        created_at: "created_at",
        username: "username",
        full_name: "full_name",
        role: "role"
    };
    const safeSortBy = sortMap[sortBy] || "created_at";
    const safeSortDir = String(sortDir).toLowerCase() === "asc" ? "ASC" : "DESC";
    query += ` ORDER BY ${safeSortBy} ${safeSortDir}`;

    const result = await db.query(query, values);
    return result.rows;
};

const createUserByAdmin = async (userData) => {
    const { username, password_hash, full_name, phone_number, role } = userData;
    const query = `
        INSERT INTO users (username, password_hash, full_name, phone_number, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, full_name, phone_number, role, is_active, created_at
    `;
    const result = await db.query(query, [username, password_hash, full_name, phone_number, role]);
    return result.rows[0];
};

const getUserById = async (id) => {
    const query = `
        SELECT id, username, full_name, phone_number, role, is_active, created_at
        FROM users
        WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

const getMyProfile = async (id) => {
    const query = `
        SELECT id, username, full_name, phone_number, role, is_active, created_at
        FROM users
        WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

const toggleUserStatus = async (id) => {
    const query = `
        UPDATE users
        SET is_active = NOT is_active
        WHERE id = $1
        RETURNING id, username, full_name, phone_number, role, is_active, created_at
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

const updateUser = async (id, { full_name, phone_number, role, password_hash }) => {
    let query = `UPDATE users SET full_name=$1, phone_number=$2, role=$3`;
    const params = [full_name, phone_number, role];

    if (password_hash) {
        params.push(password_hash);
        query += `, password_hash=$${params.length}`;
    }

    params.push(id);
    query += ` WHERE id=$${params.length} RETURNING id, username, full_name, phone_number, role, is_active, created_at`;
    const result = await db.query(query, params);
    return result.rows[0] || null;
};

const updateMyProfile = async (id, { full_name, phone_number, password_hash }) => {
    let query = `UPDATE users SET full_name=$1, phone_number=$2`;
    const params = [full_name, phone_number];

    if (password_hash) {
        params.push(password_hash);
        query += `, password_hash=$${params.length}`;
    }

    params.push(id);
    query += ` WHERE id=$${params.length} RETURNING id, username, full_name, phone_number, role, is_active, created_at`;
    const result = await db.query(query, params);
    return result.rows[0] || null;
};

const getAssignedOrders = async (userId) => {
    const query = `
        SELECT
            o.order_code,
            o.delivery_full_name,
            o.delivery_phone,
            o.delivery_address,
            o.total_amount,
            o.status,
            o.created_at,
            CASE
                WHEN o.staff_id = $1 THEN 'staff'
                WHEN o.shipper_id = $1 THEN 'shipper'
                ELSE 'unknown'
            END AS assignment_type
        FROM orders o
        WHERE (o.staff_id = $1 OR o.shipper_id = $1)
          AND o.status != 'cart'
        ORDER BY o.created_at DESC
        LIMIT 50
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
};

module.exports = {
    getUsers,
    createUserByAdmin,
    getUserById,
    toggleUserStatus,
    updateUser,
    getMyProfile,
    updateMyProfile,
    getAssignedOrders
};