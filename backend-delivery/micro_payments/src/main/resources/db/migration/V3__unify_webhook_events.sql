-- V3__unify_webhook_events.sql
-- Unificación de la tabla de de-duplicación para Stripe y PayPal

DROP TABLE IF EXISTS stripe_events;

CREATE TABLE processed_events (
    event_id VARCHAR(255) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL, -- 'STRIPE' o 'PAYPAL'
    processed_at TIMESTAMP DEFAULT NOW() NOT NULL
);
