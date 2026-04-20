-- FK INDEX: orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipper_id ON orders(shipper_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);

-- FK INDEX: order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- FK INDEX: menu_items & categories
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_menu_type_id ON categories(menu_type_id);

-- Partial index: menu_items
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured) WHERE is_featured = TRUE;

-- FK INDEX: customer_addresses
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_ward_id ON customer_addresses(ward_id);

-- FK INDEX: order_status_history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- FK INDEX: order_reviews
CREATE INDEX IF NOT EXISTS idx_order_reviews_customer_id ON order_reviews(customer_id);

-- Partial index: order_reviews
CREATE INDEX IF NOT EXISTS idx_order_reviews_featured ON order_reviews(is_featured) WHERE is_featured = TRUE;

-- FK INDEX: order_item_promotions
CREATE INDEX IF NOT EXISTS idx_order_item_promotions_order_item_id ON order_item_promotions(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_promotions_promotion_id ON order_item_promotions(promotion_id);

-- FK INDEX: promotion junction tables (reverse FK)
CREATE INDEX IF NOT EXISTS idx_promotion_menu_types_menu_type_id ON promotion_menu_types(menu_type_id);
CREATE INDEX IF NOT EXISTS idx_promotion_categories_category_id ON promotion_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_promotion_menu_items_menu_item_id ON promotion_menu_items(menu_item_id);

-- FK INDEX: cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- FK INDEX: user_tokens
CREATE INDEX IF NOT EXISTS idx_user_tokens_customer_id ON user_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- Functional index: case-insensitive lookups
CREATE INDEX IF NOT EXISTS idx_customers_lower_email ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_vouchers_upper_code ON vouchers(UPPER(code));

-- Dashboard/statistics indexes
CREATE INDEX IF NOT EXISTS idx_orders_delivery_ward ON orders(delivery_ward_name);
CREATE INDEX IF NOT EXISTS idx_promotions_active_time ON promotions(is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_read ON feedbacks(is_read);
