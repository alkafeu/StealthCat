-- Таблица для логов
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    level TEXT NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_source ON logs(source);

-- Таблица для серверов
CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hostname TEXT NOT NULL,
    port INTEGER NOT NULL,
    server_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unknown',
    latency INTEGER,
    last_check DATETIME
);

CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_servers_type ON servers(server_type);

-- Таблица для правил (исправлены названия полей)
CREATE TABLE IF NOT EXISTS rules (
    id TEXT PRIMARY KEY,
    rule_type TEXT NOT NULL,
    pattern TEXT NOT NULL,  -- изменено с 'value' на 'pattern'
    action TEXT NOT NULL,   -- изменено с 'target' на 'action'
    priority INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT 1
);

CREATE INDEX idx_rules_priority ON rules(priority);
CREATE INDEX idx_rules_type ON rules(rule_type);
CREATE INDEX idx_rules_enabled ON rules(enabled);

-- Таблица для конфигураций
CREATE TABLE IF NOT EXISTS configurations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    format TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 0
);

CREATE INDEX idx_config_active ON configurations(is_active);
CREATE INDEX idx_config_updated ON configurations(updated_at);

-- Таблица для статистики трафика
CREATE TABLE IF NOT EXISTS traffic_stats (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    upload_bytes INTEGER NOT NULL DEFAULT 0,
    download_bytes INTEGER NOT NULL DEFAULT 0,
    connections_count INTEGER NOT NULL DEFAULT 0,
    server_id TEXT,
    FOREIGN KEY (server_id) REFERENCES servers(id)
);

CREATE INDEX idx_traffic_timestamp ON traffic_stats(timestamp);
CREATE INDEX idx_traffic_server ON traffic_stats(server_id);