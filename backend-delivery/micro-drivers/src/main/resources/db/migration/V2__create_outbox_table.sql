CREATE TABLE outbox_events (
    id BIGSERIAL PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id BIGINT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0
);
CREATE INDEX idx_outbox_status_created ON outbox_events(status, created_at);
