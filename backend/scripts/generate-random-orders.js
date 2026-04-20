require("dotenv").config();

const db = require("../src/config/db");

const ORDER_STATUSES = [
    { name: "pending", weight: 8 },
    { name: "confirmed", weight: 8 },
    { name: "preparing", weight: 10 },
    { name: "shipping", weight: 12 },
    { name: "completed", weight: 52 },
    { name: "cancelled", weight: 10 }
];

const PAYMENT_METHODS = [
    { name: "cash", weight: 55 },
    { name: "transfer", weight: 25 },
    { name: "vnpay", weight: 20 }
];

const ORDER_NOTES = [
    null,
    null,
    null,
    "Giao giờ trưa",
    "Gọi trước khi giao",
    "Ít đá",
    "Không lấy muỗng đũa",
    "Để trước cửa giúp mình",
    "Món nóng giúp mình"
];

const ITEM_NOTES = [
    null,
    null,
    null,
    "Ít cay",
    "Không hành",
    "Thêm nước chấm",
    "Nhiều rau",
    "Ít ngọt"
];

const RANK_THRESHOLD = 10_000_000;

const parseArgs = (argv) => {
    const options = {
        count: 100,
        from: null,
        to: null,
        dryRun: false
    };

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "--count") {
            options.count = Number(argv[index + 1]);
            index += 1;
            continue;
        }

        if (token === "--from") {
            options.from = argv[index + 1];
            index += 1;
            continue;
        }

        if (token === "--to") {
            options.to = argv[index + 1];
            index += 1;
            continue;
        }

        if (token === "--dry-run") {
            options.dryRun = true;
        }
    }

    return options;
};

const assertValidOptions = ({ count, from, to }) => {
    if (!Number.isInteger(count) || count <= 0) {
        throw new Error("COUNT_MUST_BE_POSITIVE_INTEGER");
    }

    if (!from || !to) {
        throw new Error("FROM_AND_TO_ARE_REQUIRED");
    }

    const fromDate = new Date(`${from}T00:00:00.000`);
    const toDate = new Date(`${to}T23:59:59.999`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new Error("INVALID_DATE_RANGE");
    }

    if (fromDate > toDate) {
        throw new Error("FROM_MUST_BE_BEFORE_TO");
    }

    return { fromDate, toDate };
};

const randomInt = (min, max) => {
    const lower = Math.ceil(min);
    const upper = Math.floor(max);
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
};

const pickOne = (items) => items[randomInt(0, items.length - 1)];

const pickWeighted = (items) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * totalWeight;

    for (const item of items) {
        cursor -= item.weight;
        if (cursor <= 0) {
            return item.name;
        }
    }

    return items[items.length - 1].name;
};

const randomTimestampBetween = (fromDate, toDate) => {
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();
    return new Date(randomInt(fromMs, toMs));
};

const addMinutes = (value, minutes) => new Date(value.getTime() + minutes * 60_000);

const formatDateKey = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
};

const buildOrderCodeFactory = (existingCodes) => {
    let serial = 1;

    return (createdAt) => {
        let nextCode;

        do {
            nextCode = `ORD${formatDateKey(createdAt)}-${String(serial).padStart(5, "0")}`;
            serial += 1;
        } while (existingCodes.has(nextCode));

        existingCodes.add(nextCode);
        return nextCode;
    };
};

const sampleMenuItems = (menuItems) => {
    const desiredCount = randomInt(1, Math.min(5, menuItems.length));
    const shuffled = [...menuItems].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, desiredCount);

    return selected.map((item) => ({
        menu_item_id: item.id,
        quantity: randomInt(1, 4),
        price: Number(item.price),
        note: pickOne(ITEM_NOTES)
    }));
};

const buildPaymentState = ({ status, method, createdAt, updatedAt }) => {
    if (status === "completed") {
        if (method === "cash") {
            return {
                payment_status: "paid",
                paid_at: updatedAt,
                refund_marked_at: null
            };
        }

        return {
            payment_status: "paid",
            paid_at: addMinutes(createdAt, randomInt(5, 90)),
            refund_marked_at: null
        };
    }

    if (status === "shipping") {
        if (method === "cash") {
            return {
                payment_status: "pending",
                paid_at: null,
                refund_marked_at: null
            };
        }

        return {
            payment_status: "paid",
            paid_at: addMinutes(createdAt, randomInt(5, 120)),
            refund_marked_at: null
        };
    }

    if (status === "cancelled") {
        const onlinePaid = method !== "cash" && Math.random() < 0.45;

        return {
            payment_status: onlinePaid ? "refunded" : "failed",
            paid_at: onlinePaid ? addMinutes(createdAt, randomInt(5, 90)) : null,
            refund_marked_at: onlinePaid ? updatedAt : null
        };
    }

    if (method === "cash") {
        return {
            payment_status: "pending",
            paid_at: null,
            refund_marked_at: null
        };
    }

    const paidEarly = Math.random() < 0.65;

    return {
        payment_status: paidEarly ? "paid" : "pending",
        paid_at: paidEarly ? addMinutes(createdAt, randomInt(5, 60)) : null,
        refund_marked_at: null
    };
};

const buildStatusHistory = ({ orderId, status, shipperId, createdAt, updatedAt }) => {
    const history = [];
    const pendingAt = addMinutes(createdAt, 1);

    history.push({
        order_id: orderId,
        from_status: null,
        to_status: "cart",
        changed_by: null,
        note: null,
        created_at: createdAt
    });

    history.push({
        order_id: orderId,
        from_status: "cart",
        to_status: "pending",
        changed_by: null,
        note: null,
        created_at: pendingAt
    });

    if (status === "pending") {
        return history;
    }

    const confirmedAt = addMinutes(createdAt, randomInt(5, 90));
    history.push({
        order_id: orderId,
        from_status: "pending",
        to_status: "confirmed",
        changed_by: null,
        note: null,
        created_at: confirmedAt
    });

    if (status === "confirmed") {
        return history;
    }

    const preparingAt = addMinutes(confirmedAt, randomInt(10, 120));
    history.push({
        order_id: orderId,
        from_status: "confirmed",
        to_status: "preparing",
        changed_by: null,
        note: null,
        created_at: preparingAt
    });

    if (status === "preparing") {
        return history;
    }

    if (status === "cancelled") {
        const cancellationSource = Math.random() < 0.5 ? "pending" : "confirmed";
        const fromStatus = cancellationSource;
        const baseTime = cancellationSource === "pending" ? pendingAt : confirmedAt;

        return history
            .filter((entry) => entry.to_status !== "preparing")
            .concat({
                order_id: orderId,
                from_status: fromStatus,
                to_status: "cancelled",
                changed_by: null,
                note: "Seeded random cancelled order",
                created_at: addMinutes(baseTime, randomInt(15, 180))
            });
    }

    const shippingAt = addMinutes(preparingAt, randomInt(15, 120));
    history.push({
        order_id: orderId,
        from_status: "preparing",
        to_status: "shipping",
        changed_by: shipperId || null,
        note: null,
        created_at: shippingAt
    });

    if (status === "shipping") {
        return history;
    }

    history.push({
        order_id: orderId,
        from_status: "shipping",
        to_status: "completed",
        changed_by: shipperId || null,
        note: null,
        created_at: updatedAt
    });

    return history;
};

const loadSeedSourceData = async (client) => {
    const customersResult = await client.query(`
        SELECT
            c.id AS customer_id,
            c.full_name,
            c.phone_number,
            c.rank,
            ca.id AS address_id,
            ca.address_line,
            w.id AS ward_id,
            w.name AS ward_name,
            w.shipping_fee
        FROM customers c
        JOIN customer_addresses ca
            ON ca.customer_id = c.id
           AND ca.is_default = TRUE
        JOIN wards w
            ON w.id = ca.ward_id
        WHERE c.is_active = TRUE
        ORDER BY c.id ASC
    `);

    const shippersResult = await client.query(`
        SELECT id, full_name, phone_number
        FROM users
        WHERE role = 'shipper' AND is_active = TRUE
        ORDER BY id ASC
    `);

    const menuItemsResult = await client.query(`
        SELECT id, name, price
        FROM menu_items
        WHERE is_available = TRUE
        ORDER BY id ASC
    `);

    const existingOrdersResult = await client.query(`SELECT order_code FROM orders`);

    if (customersResult.rowCount === 0) {
        throw new Error("NO_ACTIVE_CUSTOMERS_WITH_DEFAULT_ADDRESS");
    }

    if (shippersResult.rowCount === 0) {
        throw new Error("NO_ACTIVE_SHIPPERS");
    }

    if (menuItemsResult.rowCount === 0) {
        throw new Error("NO_AVAILABLE_MENU_ITEMS");
    }

    return {
        customers: customersResult.rows.map((row) => ({
            customer_id: Number(row.customer_id),
            full_name: row.full_name,
            phone_number: row.phone_number,
            rank: row.rank,
            address_id: Number(row.address_id),
            address_line: row.address_line,
            ward_id: Number(row.ward_id),
            ward_name: row.ward_name,
            shipping_fee: Number(row.shipping_fee)
        })),
        shippers: shippersResult.rows.map((row) => ({
            id: Number(row.id),
            full_name: row.full_name,
            phone_number: row.phone_number
        })),
        menuItems: menuItemsResult.rows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            price: Number(row.price)
        })),
        existingCodes: new Set(existingOrdersResult.rows.map((row) => row.order_code))
    };
};

const createOrderBlueprint = ({
    customers,
    shippers,
    menuItems,
    generateOrderCode,
    fromDate,
    toDate
}) => {
    const customer = pickOne(customers);
    const status = pickWeighted(ORDER_STATUSES);
    const method = pickWeighted(PAYMENT_METHODS);
    const createdAt = randomTimestampBetween(fromDate, toDate);
    const shipperId = ["shipping", "completed"].includes(status)
        ? pickOne(shippers).id
        : null;
    const items = sampleMenuItems(menuItems);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = Number(customer.shipping_fee || 0);
    const discountAmount = 0;
    const updatedAt = status === "pending"
        ? addMinutes(createdAt, randomInt(3, 120))
        : status === "confirmed"
            ? addMinutes(createdAt, randomInt(30, 240))
            : status === "preparing"
                ? addMinutes(createdAt, randomInt(60, 320))
                : status === "shipping"
                    ? addMinutes(createdAt, randomInt(120, 420))
                    : addMinutes(createdAt, randomInt(180, 720));
    const totalAmount = subtotal + shippingFee - discountAmount;
    const orderCode = generateOrderCode(createdAt);
    const paymentState = buildPaymentState({
        status,
        method,
        createdAt,
        updatedAt
    });

    return {
        orderCode,
        customerId: customer.customer_id,
        shipperId,
        deliveryFullName: customer.full_name,
        deliveryPhone: customer.phone_number,
        deliveryAddress: customer.address_line,
        deliveryWardName: customer.ward_name,
        shippingFee,
        subtotal,
        discountAmount,
        totalAmount,
        status,
        notes: pickOne(ORDER_NOTES),
        createdAt,
        updatedAt,
        items,
        paymentMethod: method,
        paymentState
    };
};

const insertSeededOrders = async (client, blueprints) => {
    const insertedOrders = [];

    for (const blueprint of blueprints) {
        const orderResult = await client.query(
            `
                INSERT INTO orders (
                    order_code,
                    customer_id,
                    shipper_id,
                    delivery_full_name,
                    delivery_phone,
                    delivery_address,
                    delivery_ward_name,
                    shipping_fee,
                    subtotal,
                    discount_amount,
                    total_amount,
                    status,
                    notes,
                    created_at,
                    updated_at
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8,
                    $9, $10, $11, $12, $13, $14, $15
                )
                RETURNING id, order_code
            `,
            [
                blueprint.orderCode,
                blueprint.customerId,
                blueprint.shipperId,
                blueprint.deliveryFullName,
                blueprint.deliveryPhone,
                blueprint.deliveryAddress,
                blueprint.deliveryWardName,
                blueprint.shippingFee,
                blueprint.subtotal,
                blueprint.discountAmount,
                blueprint.totalAmount,
                blueprint.status,
                blueprint.notes,
                blueprint.createdAt,
                blueprint.updatedAt
            ]
        );

        const orderId = Number(orderResult.rows[0].id);

        for (const item of blueprint.items) {
            await client.query(
                `
                    INSERT INTO order_items (order_id, menu_item_id, quantity, price, note)
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [orderId, item.menu_item_id, item.quantity, item.price, item.note]
            );

        }

        await client.query(
            `
                INSERT INTO payments (
                    order_id,
                    method,
                    payment_status,
                    amount,
                    paid_at,
                    refund_marked_at,
                    created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                orderId,
                blueprint.paymentMethod,
                blueprint.paymentState.payment_status,
                blueprint.totalAmount,
                blueprint.paymentState.paid_at,
                blueprint.paymentState.refund_marked_at,
                blueprint.createdAt
            ]
        );

        const historyEntries = buildStatusHistory({
            orderId,
            status: blueprint.status,
            shipperId: blueprint.shipperId,
            createdAt: blueprint.createdAt,
            updatedAt: blueprint.updatedAt
        });

        for (const entry of historyEntries) {
            await client.query(
                `
                    INSERT INTO order_status_history (
                        order_id,
                        from_status,
                        to_status,
                        changed_by,
                        note,
                        created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [
                    entry.order_id,
                    entry.from_status,
                    entry.to_status,
                    entry.changed_by,
                    entry.note,
                    entry.created_at
                ]
            );
        }

        insertedOrders.push({
            id: orderId,
            orderCode: blueprint.orderCode,
            customerId: blueprint.customerId,
            status: blueprint.status,
            totalAmount: blueprint.totalAmount
        });
    }

    await client.query(`UPDATE menu_items SET sold_count = 0`);

    await client.query(`
        UPDATE menu_items mi
        SET sold_count = totals.sold_count
        FROM (
            SELECT
                oi.menu_item_id,
                COALESCE(SUM(oi.quantity), 0)::int AS sold_count
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status = 'completed'
            GROUP BY oi.menu_item_id
        ) totals
        WHERE mi.id = totals.menu_item_id
    `);

    await client.query(`
        UPDATE customers c
        SET
            total_spent = totals.total_spent,
            rank = CASE
                WHEN totals.total_spent >= $1 THEN 'loyal'
                ELSE 'normal'
            END
        FROM (
            SELECT
                customer_id,
                COALESCE(SUM(total_amount), 0)::numeric AS total_spent
            FROM orders
            WHERE status = 'completed'
              AND customer_id IS NOT NULL
            GROUP BY customer_id
        ) totals
        WHERE c.id = totals.customer_id
    `, [RANK_THRESHOLD]);

    await client.query(`
        UPDATE customers c
        SET total_spent = 0,
            rank = 'normal'
        WHERE NOT EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.customer_id = c.id
              AND o.status = 'completed'
        )
    `);

    return insertedOrders;
};

const summarizeByStatus = (orders) => {
    return orders.reduce((summary, order) => {
        summary[order.status] = (summary[order.status] || 0) + 1;
        return summary;
    }, {});
};

const main = async () => {
    const options = parseArgs(process.argv.slice(2));
    const { fromDate, toDate } = assertValidOptions(options);

    const client = await db.pool.connect();

    try {
        const seedData = await loadSeedSourceData(client);
        const generateOrderCode = buildOrderCodeFactory(seedData.existingCodes);

        const blueprints = Array.from({ length: options.count }, () => createOrderBlueprint({
            customers: seedData.customers,
            shippers: seedData.shippers,
            menuItems: seedData.menuItems,
            generateOrderCode,
            fromDate,
            toDate
        }));

        const preview = {
            count: blueprints.length,
            range: {
                from: fromDate.toISOString(),
                to: toDate.toISOString()
            },
            customersUsed: new Set(blueprints.map((item) => item.customerId)).size,
            shippersUsed: new Set(blueprints.filter((item) => item.shipperId).map((item) => item.shipperId)).size,
            statuses: summarizeByStatus(blueprints),
            sampleOrderCodes: blueprints.slice(0, 5).map((item) => item.orderCode)
        };

        if (options.dryRun) {
            console.log(JSON.stringify({ dryRun: true, preview }, null, 2));
            return;
        }

        await client.query("BEGIN");
        const insertedOrders = await insertSeededOrders(client, blueprints);
        await client.query("COMMIT");

        console.log(JSON.stringify({
            inserted: insertedOrders.length,
            preview,
            firstOrderCode: insertedOrders[0]?.orderCode || null,
            lastOrderCode: insertedOrders[insertedOrders.length - 1]?.orderCode || null
        }, null, 2));
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
        }

        console.error(error.stack || error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await db.pool.end();
    }
};

main();