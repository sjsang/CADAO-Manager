const db = require("../config/db");

const getCartItems = async (userId) => {
    let query = `SELECT cart_items.*, menu_items.name, menu_items.image_url, menu_items.price
                 FROM cart_items
                    JOIN menu_items ON cart_items.menu_item_id = menu_items.id
                 WHERE cart_items.cart_id = (
                     SELECT id FROM carts WHERE customer_id = $1
                 )`;
    const result = await db.query(query, [userId]);
    return result.rows;
};

const addCartItem = async (userId, menuItemId, quantity, note) => {
    let cartResult = await db.query(
        `SELECT id FROM carts WHERE customer_id = $1`,
        [userId]
    );

    let cartId;

    if (cartResult.rowCount === 0) {
        const newCart = await db.query(
            `INSERT INTO carts (customer_id)
             VALUES ($1)
             RETURNING id`,
            [userId]
        );
        cartId = newCart.rows[0].id;
    } else {
        cartId = cartResult.rows[0].id;
    }

    await db.query(
        `INSERT INTO cart_items (cart_id, menu_item_id, quantity, note)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cart_id, menu_item_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                       note = EXCLUDED.note`,
        [cartId, menuItemId, quantity, note]
    );
};

const updateCartItem = async (userId, menuItemId, quantity, note) => {
    let query = `UPDATE cart_items
                 SET quantity = $3,
                     note = $4
                    WHERE cart_id = (
                        SELECT id FROM carts WHERE customer_id = $1
                    ) AND menu_item_id = $2`;
    await db.query(query, [userId, menuItemId, quantity, note]);
};

const deleteCartItem = async (userId, menuItemId) => {
    let query = `DELETE FROM cart_items
                 WHERE cart_id = (
                     SELECT id FROM carts WHERE customer_id = $1
                 ) AND menu_item_id = $2`;
    await db.query(query, [userId, menuItemId]);
};

module.exports = {
    getCartItems,
    addCartItem,
    updateCartItem,
    deleteCartItem,
};