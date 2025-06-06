use sqlx::{Pool, Sqlite, SqlitePool, Row};
use anyhow::Result;
// Удалите эту строку если она есть:
// use crate::models::*;
// Удаляем эту строку:
// use chrono::NaiveDateTime;
use crate::models::{LogEntry, ProxyServer, Rule, LogLevel};
use crate::models::{Subscription, ProxyServerV2};

pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = SqlitePool::connect(database_url).await?;
        
        // Выполняем миграции
        sqlx::migrate!("./migrations").run(&pool).await?;
        
        Ok(Database { pool })
    }

    // Методы для работы с логами
    pub async fn insert_log(&self, log_entry: &LogEntry) -> Result<()> {
        let level_str = match log_entry.level {
            LogLevel::INFO => "INFO",
            LogLevel::WARN => "WARN", 
            LogLevel::ERROR => "ERROR",
            LogLevel::DEBUG => "DEBUG",
        };
        
        sqlx::query(
            r#"
            INSERT INTO logs (id, timestamp, level, source, message, details)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(uuid::Uuid::new_v4().to_string()) // генерируем ID
        .bind(log_entry.timestamp)
        .bind(level_str)
        .bind("proxy") // источник по умолчанию
        .bind(&log_entry.message)
        .bind(&log_entry.server_id)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }

    pub async fn get_logs(&self, limit: Option<i32>) -> Result<Vec<LogEntry>> {
        let limit = limit.unwrap_or(100);
        
        let rows = sqlx::query(
            "SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?"
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        let logs = rows
            .into_iter()
            .map(|row| {
                let level_str: String = row.get("level");
                let level = match level_str.as_str() {
                    "INFO" => LogLevel::INFO,
                    "WARN" => LogLevel::WARN,
                    "ERROR" => LogLevel::ERROR,
                    "DEBUG" => LogLevel::DEBUG,
                    _ => LogLevel::INFO,
                };
                
                LogEntry {
                    timestamp: row.get("timestamp"),
                    level,
                    message: row.get("message"),
                    server_id: row.get("details"),
                }
            })
            .collect();

        Ok(logs)
    }

    // Методы для работы с серверами
    pub async fn insert_server(&self, server: &ProxyServer) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO servers (id, name, hostname, port, server_type, status, latency, last_check)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&server.id)
        .bind(&server.name)
        .bind(&server.hostname)
        .bind(server.port as i32)
        .bind(&server.protocol) // используем protocol как server_type
        .bind(if server.active { "active" } else { "inactive" }) // статус на основе active
        .bind(server.latency_ms.map(|l| l as i32))
        .bind(&server.last_ping)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }

    pub async fn get_servers(&self) -> Result<Vec<ProxyServer>> {
        let rows = sqlx::query("SELECT * FROM servers ORDER BY name")
            .fetch_all(&self.pool)
            .await?;

        let servers = rows
            .into_iter()
            .map(|row| ProxyServer {
                id: row.get("id"),
                name: row.get("name"),
                hostname: row.get("hostname"),
                port: row.get::<i32, _>("port") as u16,
                protocol: row.get("server_type"), // используем server_type как protocol
                latency_ms: row.get::<Option<i32>, _>("latency").map(|l| l as u32),
                last_ping: row.get("last_check"),
                active: row.get::<String, _>("status") == "active",
            })
            .collect();

        Ok(servers)
    }

    // Методы для работы с правилами
    pub async fn insert_rule(&self, rule: &Rule) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO rules (id, rule_type, pattern, action, priority, enabled)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(rule.id.to_string()) // конвертируем u32 в String
        .bind(&rule.rule_type)
        .bind(&rule.pattern)
        .bind(&rule.action)
        .bind(0) // приоритет по умолчанию
        .bind(rule.enabled)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }

    pub async fn get_rules(&self) -> Result<Vec<Rule>> {
        let rows = sqlx::query("SELECT * FROM rules ORDER BY priority DESC, rule_type")
            .fetch_all(&self.pool)
            .await?;

        let rules = rows
            .into_iter()
            .map(|row| {
                Rule {
                    id: row.get("id"), // Убираем парсинг, оставляем как String
                    name: row.get("name"), // Теперь поле name есть в БД
                    rule_type: row.get("rule_type"),
                    pattern: row.get("pattern"),
                    action: row.get("action"),
                    priority: row.get("priority"), // Добавляем priority
                    enabled: row.get::<i64, _>("enabled") != 0,
                }
            })
            .collect();

        Ok(rules)
    }

    pub async fn get_pool(&self) -> &Pool<Sqlite> {
        &self.pool
    }

    // Методы для работы с подписками
    pub async fn insert_subscription(&self, subscription: &Subscription) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO subscriptions (id, name, url, update_interval, last_update, servers_count, active, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&subscription.id)
        .bind(&subscription.name)
        .bind(&subscription.url)
        .bind(subscription.update_interval as i32)
        .bind(&subscription.last_update)
        .bind(subscription.servers_count as i32)
        .bind(subscription.active)
        .bind(&subscription.user_agent)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn get_subscriptions(&self) -> Result<Vec<Subscription>> {
        let rows = sqlx::query("SELECT * FROM subscriptions ORDER BY name")
            .fetch_all(&self.pool)
            .await?;

        let subscriptions = rows
            .into_iter()
            .map(|row| Subscription {
                id: row.get("id"),
                name: row.get("name"),
                url: row.get("url"),
                update_interval: row.get::<i32, _>("update_interval") as u32,
                last_update: row.get("last_update"),
                servers_count: row.get::<i32, _>("servers_count") as u32,
                active: row.get("active"),
                user_agent: row.get("user_agent"),
            })
            .collect();

        Ok(subscriptions)
    }
    
    pub async fn get_subscription_by_id(&self, id: &str) -> Result<Option<Subscription>> {
        let row = sqlx::query("SELECT * FROM subscriptions WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            Ok(Some(Subscription {
                id: row.get("id"),
                name: row.get("name"),
                url: row.get("url"),
                update_interval: row.get::<i32, _>("update_interval") as u32,
                last_update: row.get("last_update"),
                servers_count: row.get::<i32, _>("servers_count") as u32,
                active: row.get("active"),
                user_agent: row.get("user_agent"),
            }))
        } else {
            Ok(None)
        }
    }
    
    pub async fn update_subscription(&self, subscription: &Subscription) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE subscriptions 
            SET name = ?, url = ?, update_interval = ?, last_update = ?, servers_count = ?, active = ?, user_agent = ?
            WHERE id = ?
            "#,
        )
        .bind(&subscription.name)
        .bind(&subscription.url)
        .bind(subscription.update_interval as i32)
        .bind(&subscription.last_update)
        .bind(subscription.servers_count as i32)
        .bind(subscription.active)
        .bind(&subscription.user_agent)
        .bind(&subscription.id)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn delete_subscription(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM subscriptions WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        
        Ok(())
    }
    
    // Методы для работы с ProxyServerV2
    pub async fn insert_server_v2(&self, server: &ProxyServerV2) -> Result<()> {
        // Создаем базовую конфигурацию на основе протокола
        // В функции update_server (строки 464-468) уже исправлены
        
        // Нужно исправить в другом месте (строки 277-300):
        let config = match server.protocol {
            crate::models::ProxyProtocol::HTTP => crate::models::ProxyConfig::Http,
            crate::models::ProxyProtocol::HTTPS => crate::models::ProxyConfig::Https,
            crate::models::ProxyProtocol::SOCKS5 => crate::models::ProxyConfig::Socks5,
            crate::models::ProxyProtocol::Shadowsocks => crate::models::ProxyConfig::Shadowsocks {
                method: "aes-256-gcm".to_string(),
                password: "default".to_string(),
            },
            crate::models::ProxyProtocol::Trojan => crate::models::ProxyConfig::Trojan {
                password: "default".to_string(),
            },
            crate::models::ProxyProtocol::VLESS => crate::models::ProxyConfig::Vless(crate::models::VlessConfig {
                uuid: "default-uuid".to_string(),
                flow: None,
                encryption: "none".to_string(),
                network: "tcp".to_string(),
                security: "tls".to_string(),
                sni: None,
                alpn: None,
                fp: None,
                pbk: None,
                sid: None,
                spx: None,
            }),
            crate::models::ProxyProtocol::VMess => crate::models::ProxyConfig::Vmess(crate::models::VmessConfig {
                uuid: "default-uuid".to_string(),
                alter_id: 0,
                security: "auto".to_string(),
                network: "tcp".to_string(),
                tls: false,
                sni: None,
                alpn: None,
            }),
        };
        
        let config_json = serde_json::to_string(&config)?;
        
        sqlx::query(
            r#"
            INSERT INTO servers_v2 (id, name, hostname, port, protocol, config, active, subscription_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            "#
        )
        .bind(&server.id)
        .bind(&server.name)
        .bind(&server.hostname)
        .bind(server.port)
        .bind(format!("{:?}", server.protocol))
        .bind(config_json)
        .bind(server.active)
        .bind(&server.subscription_id)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    // Создание новой подписки
    pub async fn create_subscription(&self, subscription: &Subscription) -> Result<String> {
        let id = uuid::Uuid::new_v4().to_string();
        
        sqlx::query(
            r#"
            INSERT INTO subscriptions (id, name, url, update_interval, last_update, servers_count, active, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(&id)
        .bind(&subscription.name)
        .bind(&subscription.url)
        .bind(subscription.update_interval as i32)
        .bind(&subscription.last_update)
        .bind(subscription.servers_count as i32)
        .bind(subscription.active)
        .bind(&subscription.user_agent)
        .execute(&self.pool)
        .await?;
        
        Ok(id)
    }
    
    // Получение подписки по ID (алиас для совместимости с API)
    pub async fn get_subscription(&self, id: &str) -> Result<Option<Subscription>> {
        self.get_subscription_by_id(id).await
    }
    
    // Обновление серверов подписки
    pub async fn update_subscription_servers(&self, subscription_id: &str, servers: &[ProxyServerV2]) -> Result<()> {
        // Удаляем старые серверы этой подписки
        sqlx::query("DELETE FROM servers_v2 WHERE subscription_id = ?")
            .bind(subscription_id)
            .execute(&self.pool)
            .await?;
        
        // Добавляем новые серверы
        for server in servers {
            let mut server_with_subscription = server.clone();
            server_with_subscription.subscription_id = Some(subscription_id.to_string());
            self.insert_server_v2(&server_with_subscription).await?;
        }
        
        // Обновляем количество серверов в подписке
        sqlx::query("UPDATE subscriptions SET servers_count = ?, last_update = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(servers.len() as i32)
            .bind(subscription_id)
            .execute(&self.pool)
            .await?;
        
        Ok(())
    }
    
    // Получение всех серверов V2
    pub async fn get_servers_v2(&self) -> Result<Vec<ProxyServerV2>> {
        let rows = sqlx::query("SELECT * FROM servers_v2 ORDER BY name")
            .fetch_all(&self.pool)
            .await?;

        let mut servers = Vec::new();
        for row in rows {
            let protocol_str: String = row.get("protocol");
            let protocol = match protocol_str.as_str() {
                "HTTP" => crate::models::ProxyProtocol::HTTP,
                "HTTPS" => crate::models::ProxyProtocol::HTTPS,
                "SOCKS5" => crate::models::ProxyProtocol::SOCKS5,
                "VLESS" => crate::models::ProxyProtocol::VLESS,
                "VMess" => crate::models::ProxyProtocol::VMess,
                "Trojan" => crate::models::ProxyProtocol::Trojan,
                "Shadowsocks" => crate::models::ProxyProtocol::Shadowsocks,
                _ => continue, // Пропускаем неизвестные протоколы
            };
            
            let config_json: String = row.get("config");
            let config: crate::models::ProxyConfig = serde_json::from_str(&config_json)?;
            
            let server = ProxyServerV2 {
                id: row.get("id"),
                name: row.get("name"),
                hostname: row.get("hostname"),
                port: row.get::<i32, _>("port") as u16,
                protocol,
                config,
                latency_ms: row.get::<Option<i32>, _>("latency").map(|l| l as u32),
                last_ping: row.get("last_check"),
                active: row.get("active"),
                country: row.get("country"),
                city: row.get("city"),
                upload_speed: row.get::<Option<i64>, _>("upload_speed").map(|s| s as u64),
                download_speed: row.get::<Option<i64>, _>("download_speed").map(|s| s as u64),
                subscription_id: row.get("subscription_id"),
            };
            
            servers.push(server);
        }

        Ok(servers)
    }
}

impl Database {
    pub async fn update_rule(&self, rule: &Rule) -> Result<()> {
        sqlx::query(
            "UPDATE rules SET name = ?, rule_type = ?, pattern = ?, action = ?, priority = ?, enabled = ? WHERE id = ?"
        )
        .bind(&rule.name)
        .bind(&rule.rule_type)
        .bind(&rule.pattern)
        .bind(&rule.action)
        .bind(rule.priority)
        .bind(rule.enabled)
        .bind(&rule.id) // Используем ссылку вместо владения
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn delete_rule(&self, rule_id: &str) -> Result<()> { // Изменяем параметр на &str
        sqlx::query("DELETE FROM rules WHERE id = ?")
            .bind(rule_id)
            .execute(&self.pool)
            .await?;
        
        Ok(())
    }

    pub async fn update_server(&self, server: &ProxyServerV2) -> Result<()> {
        let config_json = serde_json::to_string(&server.config)?;
        let protocol_str = match server.protocol {
            crate::models::ProxyProtocol::HTTP => "HTTP",        // ✅ Исправлено: Http -> HTTP
            crate::models::ProxyProtocol::HTTPS => "HTTPS",      // ✅ Исправлено: Https -> HTTPS
            crate::models::ProxyProtocol::SOCKS5 => "SOCKS5",    // ✅ Исправлено: Socks5 -> SOCKS5
            crate::models::ProxyProtocol::VLESS => "VLESS",      // ✅ Исправлено: Vless -> VLESS
            crate::models::ProxyProtocol::VMess => "VMess",      // ✅ Исправлено: Vmess -> VMess
            crate::models::ProxyProtocol::Trojan => "Trojan",
            crate::models::ProxyProtocol::Shadowsocks => "Shadowsocks",
        };
        
        sqlx::query(
            "UPDATE servers_v2 SET name = ?, hostname = ?, port = ?, protocol = ?, config = ?, latency = ?, active = ?, country = ?, city = ?, upload_speed = ?, download_speed = ? WHERE id = ?"
        )
        .bind(&server.name)
        .bind(&server.hostname)
        .bind(server.port as i32)
        .bind(protocol_str)
        .bind(&config_json)
        .bind(server.latency_ms.map(|l| l as i32))
        .bind(server.active)
        .bind(&server.country)
        .bind(&server.city)
        .bind(server.upload_speed.map(|s| s as i64))
        .bind(server.download_speed.map(|s| s as i64))
        .bind(&server.id)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }

    pub async fn delete_server(&self, server_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM servers_v2 WHERE id = ?")  // ✅ Исправлено: servers_v2
            .bind(server_id)
            .execute(&self.pool)
            .await?;
        
        Ok(())
    }
}