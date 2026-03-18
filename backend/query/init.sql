-- 1. Phân loại Menu (Đồ ăn/Đồ uống)
CREATE TABLE menu_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Danh mục (Món kho, món chiên,...)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    menu_type_id INT NOT NULL REFERENCES menu_types(id) ON DELETE CASCADE
);

-- 3. Món ăn
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    category_id INT NOT NULL REFERENCES categories(id),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Nhân viên
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150),
    phone_number VARCHAR(20),
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'staff', 'shipper')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Khách hàng 
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Phường
CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    shipping_fee NUMERIC(12,2) NOT NULL CHECK (shipping_fee >= 0)
);

-- 7. Địa chỉ khách hàng
CREATE TABLE customer_addresses (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL
        REFERENCES customers(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    ward_id INT NOT NULL
        REFERENCES wards(id),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Đơn hàng
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(20) UNIQUE NOT NULL,

    customer_id INT
        REFERENCES customers(id),

    staff_id INT
        REFERENCES users(id),

    shipper_id INT
        REFERENCES users(id),

    delivery_full_name VARCHAR(150) NOT NULL,
    delivery_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_ward_name VARCHAR(150) NOT NULL,

    shipping_fee NUMERIC(12,2) DEFAULT 0 CHECK (shipping_fee >= 0),
    subtotal NUMERIC(12,2) DEFAULT 0 CHECK (subtotal >= 0),
    discount_amount NUMERIC(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12,2) DEFAULT 0 CHECK (total_amount >= 0),

    status VARCHAR(30) DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'confirmed',
            'preparing',
            'shipping',
            'completed',
            'cancelled'
        )),

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Chi tiết đơn hàng
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL
        REFERENCES menu_items(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    note TEXT
);

-- 10. Thanh toán
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE
        REFERENCES orders(id) ON DELETE CASCADE,

    method VARCHAR(50)
        CHECK (method IN ('cash', 'card', 'transfer', 'e-wallet')),

    payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    transaction_code VARCHAR(100),

    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Vouchers
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,

    discount_percent INT
        CHECK (discount_percent BETWEEN 0 AND 100),

    discount_amount NUMERIC(12,2),

    min_order_value NUMERIC(12,2) DEFAULT 0,
    max_discount NUMERIC(12,2),

    expiry_date TIMESTAMP,
    usage_limit INT,
    used_count INT DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Order - Voucher
CREATE TABLE order_vouchers (
    order_id INT PRIMARY KEY
        REFERENCES orders(id) ON DELETE CASCADE,
    voucher_id INT NOT NULL
        REFERENCES vouchers(id)
);

-- 13. Giỏ hàng
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    customer_id INT UNIQUE
        REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Chi tiết giỏ hàng
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL 
        REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL 
        REFERENCES menu_items(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(cart_id, menu_item_id)
);