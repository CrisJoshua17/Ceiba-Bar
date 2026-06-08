CREATE TABLE drivers (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    user_email VARCHAR(255),
    moto_id VARCHAR(255),
    license_plate VARCHAR(255),
    license_number VARCHAR(255),
    rating DOUBLE PRECISION DEFAULT 0.0,
    total_deliveries INTEGER DEFAULT 0,
    registration_date TIMESTAMP
);
