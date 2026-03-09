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

-- 4. Bàn
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    capacity INT DEFAULT 4, -- Sức chứa
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'out_of_service'))
);

-- 5. Nhân viên/Người dùng
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150),
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE
);

-- 6. Hóa đơn (Orders)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id),
    user_id INT REFERENCES users(id), -- Nhân viên phục vụ/tạo đơn
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    total_amount NUMERIC(12,2) DEFAULT 0 CHECK (total_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT -- Ghi chú chung (ví dụ: khách dị ứng hành)
);

-- 7. Chi tiết món trong đơn
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0), -- Giá lúc bán
    note TEXT -- Ghi chú món (ví dụ: ít đường, không cay)
);

-- 8. Thanh toán
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE REFERENCES orders(id),
    method VARCHAR(50) CHECK (method IN ('cash', 'card', 'transfer', 'e-wallet')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm dữ liệu
INSERT INTO menu_types (name) VALUES ('Món ăn');
INSERT INTO menu_types (name) VALUES ('Món uống');

INSERT INTO categories (name, menu_type_id) VALUES ('Món kho', 1);
INSERT INTO categories (name, menu_type_id) VALUES ('Cà phê', 2);

INSERT INTO menu_items (name, price, category_id) VALUES ('Ba rọi kho tiêu', 55000, 1);
INSERT INTO menu_items (name, price, category_id) VALUES ('Cà phê sữa', 33000, 2);

SELECT
	mi.name,
	mi.price,
	c.name AS "Danh mục",
	mt.name AS "Loại"
FROM menu_items mi
JOIN categories c ON mi.category_id = c.id
JOIN menu_types mt ON c.menu_type_id = mt.id;













