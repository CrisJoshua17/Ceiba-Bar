CREATE TABLE menus (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    type VARCHAR(255),
    available_from TIME,
    available_until TIME,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE menu_available_days (
    menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    day_of_week VARCHAR(255) NOT NULL,
    PRIMARY KEY (menu_id, day_of_week)
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    menu_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    image VARCHAR(255),
    available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE drinks (
    product_id BIGINT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL
);

CREATE TABLE snacks (
    product_id BIGINT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE recetary (
    product_id BIGINT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE delivery_zones (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    center_latitude DOUBLE PRECISION,
    center_longitude DOUBLE PRECISION,
    radius_km DOUBLE PRECISION,
    delivery_fee NUMERIC(10, 2),
    estimated_minutes INTEGER,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock_reservations (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    product_id BIGINT,
    quantity INTEGER,
    status VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reservation_order ON stock_reservations(order_id, status);
