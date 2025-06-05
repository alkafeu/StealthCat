-- Таблица для подписок
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    update_interval INTEGER NOT NULL DEFAULT 24,
    last_update DATETIME,
    servers_count INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Расширенная таблица серверов с поддержкой V2Ray протоколов
CREATE TABLE IF NOT EXISTS servers_v2 (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hostname TEXT NOT NULL,
    port INTEGER NOT NULL,
    protocol TEXT NOT NULL,
    config TEXT NOT NULL, -- JSON конфигурация
    latency INTEGER,
    last_check DATETIME,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    country TEXT,
    city TEXT,
    upload_speed INTEGER,
    download_speed INTEGER,
    subscription_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_servers_v2_protocol ON servers_v2(protocol);
CREATE INDEX IF NOT EXISTS idx_servers_v2_active ON servers_v2(active);
CREATE INDEX IF NOT EXISTS idx_servers_v2_subscription ON servers_v2(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(active);