CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    driver_id BIGINT,
    status VARCHAR(255),
    street VARCHAR(255),
    colonia VARCHAR(255),
    city VARCHAR(255),
    postal_code VARCHAR(255),
    reference VARCHAR(255),
    delivery_latitude DOUBLE PRECISION,
    delivery_longitude DOUBLE PRECISION,
    subtotal NUMERIC(10, 2),
    delivery_fee NUMERIC(10, 2),
    discount NUMERIC(10, 2) DEFAULT 0.00,
    tip NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2),
    payment_method VARCHAR(255),
    notes VARCHAR(255),
    rating INTEGER,
    feedback VARCHAR(255),
    rated_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT,
    product_name VARCHAR(255),
    product_image VARCHAR(255),
    unit_price NUMERIC(10, 2),
    quantity INTEGER,
    subtotal NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    driver_id BIGINT,
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    delivery_latitude DOUBLE PRECISION,
    delivery_longitude DOUBLE PRECISION,
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    notes TEXT,
    status VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_events (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    event_type VARCHAR(255),
    payload TEXT,
    triggered_by VARCHAR(255),
    occurred_at TIMESTAMP
);

CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX idx_orders_driver_status ON orders(driver_id, status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_events_order ON order_events(order_id);
CREATE INDEX idx_events_occurred ON order_events(occurred_at);
