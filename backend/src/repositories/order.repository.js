const db = require('../config/db');
const { getPaymentByOrderId, createPayment } = require('./payment.repository');

const createOrderStatusHistory = async (orderId, fromStatus, toStatus, changedBy = null, note = null) => {
    const query = `
        INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const result = await db.query(query, [orderId, fromStatus, toStatus, changedBy, note]);
    return result.rows[0];
};

const getOrderStatusHistoryByOrderId = async (orderId) => {
    const query = `
        SELECT osh.*, u.username, u.full_name
        FROM order_status_history osh
        LEFT JOIN users u ON osh.changed_by = u.id
        WHERE osh.order_id = $1
        ORDER BY osh.created_at ASC, osh.id ASC
    `;
    const result = await db.query(query, [orderId]);
    return result.rows;
};

const getAllOrders = async ({ search = "", status = "all", sortBy = "created_at", sortDir = "desc", page = 1, limit = 5 } = {}) => {
    const params = [];
    const conditions = [];

    const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 100) : 5;
    const offset = (safePage - 1) * safeLimit;

    let fromWhere = `
        FROM orders o
    `;

    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(o.order_code ILIKE $${params.length} OR o.delivery_full_name ILIKE $${params.length})`);
    }

    if (["pending", "confirmed", "preparing", "shipping", "completed", "cancelled"].includes(status)) {
        params.push(status);
        conditions.push(`o.status = $${params.length}`);
    }

    if (conditions.length > 0) {
        fromWhere += ` WHERE ${conditions.join(" AND ")}`;
    }

    const countQuery = `SELECT COUNT(*)::int AS total ${fromWhere}`;
    const countResult = await db.query(countQuery, params);
    const totalItems = countResult.rows[0]?.total || 0;

    const sortMap = {
        created_at: "o.created_at",
        total_amount: "o.total_amount",
        delivery_full_name: "o.delivery_full_name"
    };
    const safeSortBy = sortMap[sortBy] || "o.created_at";
    const safeSortDir = String(sortDir).toLowerCase() === "asc" ? "ASC" : "DESC";

    params.push(safeLimit);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const query = `
        SELECT o.order_code, o.delivery_full_name, o.delivery_phone, o.delivery_address,
               o.total_amount, o.status, o.created_at
        ${fromWhere}
        ORDER BY ${safeSortBy} ${safeSortDir}
        LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const result = await db.query(query, params);
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

        const defaultAddressResult = await db.query(
            `SELECT ca.address_line, w.name AS ward_name, w.shipping_fee
             FROM customer_addresses ca
             JOIN wards w ON w.id = ca.ward_id
             WHERE ca.customer_id = $1 AND ca.is_default = TRUE
             LIMIT 1`,
            [customerId]
        );

        if (defaultAddressResult.rowCount === 0) {
            throw new Error("DEFAULT_ADDRESS_REQUIRED");
        }

        const defaultAddress = defaultAddressResult.rows[0];
        const shippingFee = Number(defaultAddress.shipping_fee || 0);

        const existingOrderRes = await db.query(
            "SELECT id FROM orders WHERE customer_id=$1 AND status='cart' LIMIT 1",
            [customerId]
        );

        let orderId;
        let orderCode;
        let subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let totalAmount = subtotal + shippingFee - (orderData.discountAmount || 0);

        if (existingOrderRes.rowCount > 0) {
            orderId = existingOrderRes.rows[0].id;
            await db.query(
                `UPDATE orders SET delivery_full_name=$1, delivery_phone=$2, delivery_address=$3,
         delivery_ward_name=$4, shipping_fee=$5, subtotal=$6, discount_amount=$7, total_amount=$8, notes=$9,
         updated_at=CURRENT_TIMESTAMP
         WHERE id=$10`,
                [
                    orderData.deliveryFullName,
                    orderData.deliveryPhone,
                    defaultAddress.address_line,
                    defaultAddress.ward_name,
                    shippingFee,
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
                    defaultAddress.address_line,
                    defaultAddress.ward_name,
                    shippingFee,
                    subtotal,
                    orderData.discountAmount || 0,
                    totalAmount,
                    orderData.notes || null
                ]
            );
            orderId = orderResult.rows[0].id;

            await createOrderStatusHistory(orderId, null, 'cart', null, null);
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
    const currentOrderResult = await db.query(`SELECT id, status FROM orders WHERE order_code = $1`, [orderCode]);

    if (currentOrderResult.rowCount === 0) {
        throw new Error('Order not found');
    }

    const currentOrder = currentOrderResult.rows[0];

    const orderQuery = `UPDATE orders SET status='pending', delivery_full_name=$1, delivery_phone=$2, delivery_address=$3,
        delivery_ward_name=$4, shipping_fee=$5, subtotal=$6, discount_amount=$7, total_amount=$8, notes=$9,
        updated_at=CURRENT_TIMESTAMP
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

    await createOrderStatusHistory(orderId, currentOrder.status, 'pending', null, null);

    return { orderId: orderResult.rows[0].id, paymentId: paymentResult.id };
};

const getOrderByOrderCode = async (orderCode) => {
    const orderQuery = `
        SELECT o.id, o.order_code, o.customer_id, o.delivery_full_name, o.delivery_phone, o.delivery_address,
                o.delivery_ward_name, o.shipping_fee, o.subtotal, o.discount_amount, o.total_amount, o.status, o.notes,
                o.created_at, o.updated_at,
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
        const statusHistory = await getOrderStatusHistoryByOrderId(order.id);
        order.payment = payment;
        order.status_history = statusHistory;
    }
    return order;
};

const cancelOrder = async (orderCode) => {
    const currentOrderResult = await db.query(`SELECT id, status FROM orders WHERE order_code = $1`, [orderCode]);

    if (currentOrderResult.rowCount === 0) {
        return null;
    }

    const currentOrder = currentOrderResult.rows[0];

    const query = `UPDATE orders SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE order_code=$1 RETURNING id`;
    const result = await db.query(query, [orderCode]);

    if (result.rowCount > 0) {
        await createOrderStatusHistory(result.rows[0].id, currentOrder.status, 'cancelled', null, 'Khách hàng hủy đơn');
        return result.rows[0].id;
    }

    return null;
};

const getDeliveryHistoryByShipperId = async (shipperId) => {
    const query = `
        SELECT o.order_code, o.delivery_full_name, o.delivery_phone,
               o.delivery_address, o.delivery_ward_name,
               o.total_amount, o.status, o.notes, o.created_at, o.updated_at
        FROM orders o
        WHERE o.shipper_id = $1
          AND o.status IN ('completed', 'cancelled')
        ORDER BY o.updated_at DESC, o.created_at DESC
    `;
    const result = await db.query(query, [shipperId]);
    return result.rows;
};

const updateOrderStatus = async (orderCode, status, changedBy = null, changedByRole = null, note = null, shipperId = null) => {
    const currentOrderResult = await db.query(`SELECT id, status FROM orders WHERE order_code = $1`, [orderCode]);

    if (currentOrderResult.rowCount === 0) {
        return null;
    }

    const currentOrder = currentOrderResult.rows[0];

    const setClauses = ["status=$1", "updated_at=CURRENT_TIMESTAMP"];
    const params = [status];

    if (status === 'shipping' && shipperId) {
        params.push(shipperId);
        setClauses.push(`shipper_id=$${params.length}`);
    }

    if (changedByRole === 'staff' && changedBy) {
        params.push(changedBy);
        setClauses.push(`staff_id=$${params.length}`);
    }

    params.push(orderCode);
    const query = `
        UPDATE orders
        SET ${setClauses.join(", ")}
        WHERE order_code=$${params.length}
        RETURNING id, order_code, status
    `;

    const result = await db.query(query, params);

    if (result.rows[0]) {
        await createOrderStatusHistory(result.rows[0].id, currentOrder.status, status, changedBy, note);
    }

    return result.rows[0] || null;
};

const getShippers = async () => {
    const query = `
        SELECT id, username, full_name, phone_number
        FROM users
        WHERE role = 'shipper' AND is_active = TRUE
        ORDER BY full_name ASC
    `;
    const result = await db.query(query);
    return result.rows;
};

const getOrdersByShipperId = async (shipperId) => {
    const query = `
        SELECT o.order_code, o.delivery_full_name, o.delivery_phone,
               o.delivery_address, o.delivery_ward_name,
               o.total_amount, o.status, o.notes, o.created_at
        FROM orders o
        WHERE o.shipper_id = $1 AND o.status = 'shipping'
        ORDER BY o.created_at ASC
    `;
    const result = await db.query(query, [shipperId]);
    return result.rows;
};

const completeDelivery = async (orderCode, shipperId) => {
    const check = await db.query(
        `SELECT id, status, shipper_id FROM orders WHERE order_code = $1`,
        [orderCode]
    );

    if (check.rowCount === 0) throw new Error('ORDER_NOT_FOUND');
    const order = check.rows[0];

    if (order.status !== 'shipping') throw new Error('ORDER_NOT_SHIPPING');
    if (order.shipper_id !== shipperId) throw new Error('NOT_ASSIGNED');

    const result = await db.query(
        `UPDATE orders SET status='completed', updated_at=CURRENT_TIMESTAMP
         WHERE order_code=$1 RETURNING id, order_code, status`,
        [orderCode]
    );

    await createOrderStatusHistory(result.rows[0].id, 'shipping', 'completed', shipperId, null);
    return result.rows[0];
};

module.exports = {
    getAllOrders,
    getOrdersByCustomerId,
    createOrUpdateOrder,
    getOrderByOrderCode,
    confirmOrder,
    cancelOrder,
    updateOrderStatus,
    createOrderStatusHistory,
    getOrderStatusHistoryByOrderId,
    getShippers,
    getOrdersByShipperId,
    getDeliveryHistoryByShipperId,
    completeDelivery
};