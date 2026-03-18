const db = require('../config/db');
const { getPaymentByOrderId, createPayment } = require('./payment.repository');

const getOrdersByCustomerId = async (customerId) => {
    const query = `
        SELECT o.order_code, o.delivery_full_name, o.delivery_phone, o.delivery_address,
               o.total_amount, o.status
        FROM orders o
        WHERE o.customer_id = $1 AND o.status != 'cart'
        ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [customerId]);
    return result.rows;
};

const generateOrderCode = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000);
    return `ORD${y}${m}${d}-${random}`;
};

const createOrUpdateOrder = async (customerId, orderData) => {
    try {
        await db.query("BEGIN");

        const existingOrderRes = await db.query(
            "SELECT id FROM orders WHERE customer_id=$1 AND status='cart' LIMIT 1",
            [customerId]
        );

        let orderId;
        let orderCode;
        let subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let totalAmount = subtotal + (orderData.shippingFee || 0) - (orderData.discountAmount || 0);

        if (existingOrderRes.rowCount > 0) {
            orderId = existingOrderRes.rows[0].id;
            await db.query(
                `UPDATE orders SET delivery_full_name=$1, delivery_phone=$2, delivery_address=$3,
         delivery_ward_name=$4, shipping_fee=$5, subtotal=$6, discount_amount=$7, total_amount=$8, notes=$9
         WHERE id=$10`,
                [
                    orderData.deliveryFullName,
                    orderData.deliveryPhone,
                    orderData.deliveryAddress,
                    orderData.deliveryWardName,
                    orderData.shippingFee || 0,
                    subtotal,
                    orderData.discountAmount || 0,
                    totalAmount,
                    orderData.notes || null,
                    orderId
                ]
            );

            await db.query(`DELETE FROM order_items WHERE order_id=$1`, [orderId]);

            orderCode = (await db.query("SELECT order_code FROM orders WHERE id=$1", [orderId])).rows[0].order_code;
        } else {
            orderCode = generateOrderCode();
            const orderResult = await db.query(
                `INSERT INTO orders (order_code, customer_id, delivery_full_name, delivery_phone, delivery_address,
         delivery_ward_name, shipping_fee, subtotal, discount_amount, total_amount, notes, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'cart') RETURNING id`,
                [
                    orderCode,
                    customerId,
                    orderData.deliveryFullName,
                    orderData.deliveryPhone,
                    orderData.deliveryAddress,
                    orderData.deliveryWardName,
                    orderData.shippingFee || 0,
                    subtotal,
                    orderData.discountAmount || 0,
                    totalAmount,
                    orderData.notes || null
                ]
            );
            orderId = orderResult.rows[0].id;
        }

        const itemQuery = `INSERT INTO order_items (order_id, menu_item_id, quantity, price, note)
                       VALUES ($1,$2,$3,$4,$5)`;
        for (const item of orderData.items) {
            await db.query(itemQuery, [
                orderId,
                item.menu_item_id,
                item.quantity,
                item.price,
                item.note || null
            ]);
        }

        await db.query("COMMIT");

        return { orderId, orderCode, totalAmount };
    } catch (err) {
        await db.query("ROLLBACK");
        console.error("Error in createOrUpdateOrder:", err);
        throw err;
    }
};

const confirmOrder = async (orderCode, orderData, paymentMethod) => {
    const orderQuery = `UPDATE orders SET status='pending', delivery_full_name=$1, delivery_phone=$2, delivery_address=$3,
        delivery_ward_name=$4, shipping_fee=$5, subtotal=$6, discount_amount=$7, total_amount=$8, notes=$9
        WHERE order_code=$10 RETURNING id, order_code`;
    const orderResult = await db.query(orderQuery, [
        orderData.delivery_full_name,
        orderData.delivery_phone,
        orderData.delivery_address,
        orderData.delivery_ward_name,
        orderData.shipping_fee,
        orderData.subtotal,
        orderData.discount_amount,
        orderData.total_amount,
        orderData.notes,
        orderCode
    ]);
    const orderId = orderResult.rows[0].id;
    const paymentResult = await createPayment(orderId, paymentMethod, orderData.total_amount);
    return { orderId: orderResult.rows[0].id, paymentId: paymentResult.id };
};

const getOrderByOrderCode = async (orderCode) => {
    const orderQuery = `
        SELECT o.id, o.order_code, o.customer_id, o.delivery_full_name, o.delivery_phone, o.delivery_address,
                o.delivery_ward_name, o.shipping_fee, o.subtotal, o.discount_amount, o.total_amount, o.status, o.notes,
                json_agg(json_build_object(
                    'name', mi.name,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'note', oi.note
                )) AS items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE o.order_code = $1
        GROUP BY o.id
    `;

    const result = await db.query(orderQuery, [orderCode]);
    const order = result.rows[0];
    if (order) {
        const payment = await getPaymentByOrderId(order.id);
        order.payment = payment;
    }
    return order;
};

const cancelOrder = async (orderCode) => {
    const query = `UPDATE orders SET status='cancelled' WHERE order_code=$1 RETURNING id`;
    const result = await db.query(query, [orderCode]);
    return result.rowCount > 0 ? result.rows[0].id : null;
};

module.exports = {
    getOrdersByCustomerId,
    createOrUpdateOrder,
    getOrderByOrderCode,
    confirmOrder,
    cancelOrder
};