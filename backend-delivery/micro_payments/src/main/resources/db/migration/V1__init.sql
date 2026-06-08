CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    customer_id BIGINT,
    amount NUMERIC(10, 2),
    currency VARCHAR(255) DEFAULT 'MXN',
    method VARCHAR(255),
    status VARCHAR(255),
    transaction_id VARCHAR(255),
    idempotency_key VARCHAR(255),
    receipt_url VARCHAR(255),
    refund_amount NUMERIC(10, 2),
    refund_reason VARCHAR(255),
    refunded_at TIMESTAMP,
    temp_order_data TEXT,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    paypal_payer_id VARCHAR(255),
    paypal_capture_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stripe_events (
    event_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_payment_order ON payments(order_id);
CREATE INDEX idx_payment_idempotency ON payments(idempotency_key);
