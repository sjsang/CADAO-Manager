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
    sold_count INT NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Người dùng nội bộ
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150),
    avatar_url TEXT,
    phone_number VARCHAR(20),
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'shipper')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Khách hàng 
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(150) UNIQUE,
    avatar_url TEXT,
    password_hash TEXT,
    rank VARCHAR(20) DEFAULT 'normal' CHECK (rank IN ('normal', 'loyal')),
    total_spent NUMERIC(15,2) DEFAULT 0,
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

    status VARCHAR(30) DEFAULT 'cart'
        CHECK (status IN (
            'cart',
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

-- 8. Chi tiết đơn hàng
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

-- 8. Đánh giá đơn hàng
CREATE TABLE order_reviews (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE
        REFERENCES orders(id) ON DELETE CASCADE,
    customer_id INT NOT NULL
        REFERENCES customers(id) ON DELETE CASCADE,
    rating NUMERIC(3,2) NOT NULL
        CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL
        CHECK (char_length(trim(content)) > 0),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8b. Đánh giá từng món trong đơn
CREATE TABLE order_review_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, menu_item_id)
);

-- 9. Thanh toán
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE
        REFERENCES orders(id) ON DELETE CASCADE,

    method VARCHAR(50)
        CHECK (method IN ('cash', 'transfer', 'vnpay')),

    payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),

    paid_at TIMESTAMP,
    refund_bank_name VARCHAR(150),
    refund_account_number VARCHAR(50),
    refund_account_name VARCHAR(150),
    refund_note TEXT,
    refund_requested_at TIMESTAMP,
    refund_marked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Vouchers
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

    max_usage_per_customer INT CHECK (max_usage_per_customer > 0),

    applicable_rank VARCHAR(20) DEFAULT 'all' CHECK (applicable_rank IN ('all', 'normal', 'loyal')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10b. Lịch sử sử dụng voucher theo khách hàng
CREATE TABLE customer_voucher_usage (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    voucher_id INT NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    used_count INT NOT NULL DEFAULT 1,
    UNIQUE(customer_id, voucher_id)
);

-- 11. Order - Voucher
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
	note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(cart_id, menu_item_id)
);

-- 15. Token
CREATE TABLE user_tokens (
    id SERIAL PRIMARY KEY,
    customer_id INT
        REFERENCES customers(id) ON DELETE CASCADE,
    user_id INT
        REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Lịch sử thay đổi trạng thái đơn hàng
CREATE TABLE order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by INT REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Hội thoại chat khách hàng - admin
CREATE TABLE chat_conversations (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    admin_user_id INT NOT NULL REFERENCES users(id),
    is_bot_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Tin nhắn chat
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin', 'bot')),
    sender_customer_id INT REFERENCES customers(id),
    sender_user_id INT REFERENCES users(id),
    text TEXT NOT NULL CHECK (char_length(trim(text)) > 0),
    is_read_by_customer BOOLEAN NOT NULL DEFAULT FALSE,
    is_read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (sender_type = 'customer' AND sender_customer_id IS NOT NULL AND sender_user_id IS NULL)
        OR
        (sender_type IN ('admin', 'bot') AND sender_user_id IS NOT NULL AND sender_customer_id IS NULL)
    )
);

CREATE INDEX idx_chat_messages_conversation_created_at
    ON chat_messages(conversation_id, created_at DESC);

CREATE INDEX idx_chat_messages_admin_unread
    ON chat_messages(conversation_id)
    WHERE sender_type = 'customer' AND is_read_by_admin = FALSE;

CREATE INDEX idx_chat_messages_customer_unread
    ON chat_messages(conversation_id)
    WHERE sender_type IN ('admin', 'bot') AND is_read_by_customer = FALSE;


-- 19. Chương trình khuyến mãi
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    discount_percent INT CHECK (discount_percent BETWEEN 0 AND 100),
    discount_amount NUMERIC(12,2),

    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    applicable_rank VARCHAR(20) DEFAULT 'all' CHECK (applicable_rank IN ('all', 'normal', 'loyal')),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        (discount_percent IS NOT NULL AND discount_amount IS NULL)
        OR
        (discount_percent IS NULL AND discount_amount IS NOT NULL)
    ),

    CHECK (end_time > start_time)
);

-- 19.1 Promotion - Menu type
CREATE TABLE promotion_menu_types (
    promotion_id INT 
        REFERENCES promotions(id) ON DELETE CASCADE,
    menu_type_id INT 
        REFERENCES menu_types(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, menu_type_id)
);

-- 19.2 Promotion - Category
CREATE TABLE promotion_categories (
    promotion_id INT 
        REFERENCES promotions(id) ON DELETE CASCADE,
    category_id INT 
        REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, category_id)
);

-- 19.3 Promotion - Menu item
CREATE TABLE promotion_menu_items (
    promotion_id INT 
        REFERENCES promotions(id) ON DELETE CASCADE,
    menu_item_id INT 
        REFERENCES menu_items(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, menu_item_id)
);

-- 20. Lịch sử áp dụng khuyến mãi cho đơn hàng
CREATE TABLE order_item_promotions (
    id SERIAL PRIMARY KEY,

    order_item_id INT NOT NULL
        REFERENCES order_items(id) ON DELETE CASCADE,

    promotion_id INT
        REFERENCES promotions(id),

    promotion_name VARCHAR(200) NOT NULL,

    discount_percent INT,
    discount_amount NUMERIC(12,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thông báo cho khách hàng
CREATE TABLE customer_notifications (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_notifications_customer ON customer_notifications(customer_id, is_read, created_at DESC);



-- 22. Góp ý từ khách hàng (trang Liên hệ)
CREATE TABLE feedbacks (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);