CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    user_email VARCHAR(255) UNIQUE,
    total_orders INTEGER DEFAULT 0,
    total_spent DOUBLE PRECISION DEFAULT 0.0,
    member_since TIMESTAMP,
    last_order_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE addresses (
    id BIGSERIAL PRIMARY KEY,
    alias VARCHAR(255),
    street VARCHAR(255) NOT NULL,
    colonia VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    delegacion VARCHAR(255) NOT NULL,
    postal_code VARCHAR(255) NOT NULL,
    instructions VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE customer_addresses (
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_id BIGINT NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, address_id)
);
