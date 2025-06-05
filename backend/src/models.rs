use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub proxy_status: ProxyStatus,
    pub stats: TrafficStats,
    pub servers: Vec<ProxyServer>,
    pub current_server: Option<String>,
    pub config: MihomoConfig,
    pub rules: Vec<Rule>,
    pub logs: Vec<LogEntry>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            proxy_status: ProxyStatus {
                connected: false,
                mode: ProxyMode::Global,
                uptime: 0,
                last_error: None,
            },
            stats: TrafficStats {
                bytes_up: 0,
                bytes_down: 0,
                active_connections: 0,
                total_requests: 0,
            },
            servers: vec![
                ProxyServer {
                    id: "server1".to_string(),
                    name: "Основной сервер".to_string(),
                    hostname: "proxy.example.com".to_string(),
                    port: 8080,
                    protocol: "HTTP".to_string(),
                    latency_ms: Some(45),
                    last_ping: Some(Utc::now()),
                    active: true,
                },
                ProxyServer {
                    id: "server2".to_string(),
                    name: "Резервный сервер".to_string(),
                    hostname: "backup.example.com".to_string(),
                    port: 8080,
                    protocol: "HTTPS".to_string(),
                    latency_ms: Some(67),
                    last_ping: Some(Utc::now()),
                    active: false,
                },
            ],
            current_server: None,
            config: MihomoConfig {
                raw_config: "# Default config".to_string(),
                format: ConfigFormat::YAML,
                last_modified: Utc::now(),
            },
            rules: vec![
                Rule {
                    id: "1".to_string(),  // Изменяем на String
                    name: "Блокировка рекламы".to_string(),
                    rule_type: "domain".to_string(),
                    pattern: "*.ads.google.com".to_string(),
                    action: "block".to_string(),
                    priority: 1,  // Добавляем priority
                    enabled: true,
                },
                Rule {
                    id: "2".to_string(),  // Изменяем на String
                    name: "Прямое соединение для локальных сайтов".to_string(),
                    rule_type: "domain".to_string(),
                    pattern: "*.local".to_string(),
                    action: "direct".to_string(),
                    priority: 2,  // Добавляем priority
                    enabled: true,
                },
            ],
            logs: vec![
                LogEntry {
                    timestamp: Utc::now(),
                    level: LogLevel::INFO,
                    message: "Прокси сервер запущен".to_string(),
                    server_id: Some("server1".to_string()),
                },
            ],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyStatus {
    pub connected: bool,
    pub mode: ProxyMode,
    pub uptime: u64,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProxyMode {
    Global,
    PAC,
    Bypass,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyServer {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub port: u16,
    pub protocol: String,
    pub latency_ms: Option<u32>,
    pub last_ping: Option<DateTime<Utc>>,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficStats {
    pub bytes_up: u64,
    pub bytes_down: u64,
    pub active_connections: u32,
    pub total_requests: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: DateTime<Utc>,
    pub level: LogLevel,
    pub message: String,
    pub server_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    INFO,
    WARN,
    ERROR,
    DEBUG,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MihomoConfig {
    pub raw_config: String,
    pub format: ConfigFormat,
    pub last_modified: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigFormat {
    YAML,
    JSON,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<ApiError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub code: u16,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub id: String,
    pub name: String,      // Добавляем отсутствующее поле name
    pub rule_type: String,
    pub pattern: String,
    pub action: String,
    pub priority: i32,
    pub enabled: bool,
}

// Новые типы протоколов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProxyProtocol {
    HTTP,
    HTTPS,
    SOCKS5,
    VLESS,
    VMess,
    Trojan,
    Shadowsocks,
}

// Конфигурация для VLESS
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VlessConfig {
    pub uuid: String,
    pub flow: Option<String>, // xtls-rprx-vision, etc.
    pub encryption: String,   // none
    pub network: String,      // tcp, ws, grpc
    pub security: String,     // tls, reality
    pub sni: Option<String>,
    pub alpn: Option<Vec<String>>,
    pub fp: Option<String>,   // fingerprint
    pub pbk: Option<String>,  // public key for reality
    pub sid: Option<String>,  // short id for reality
    pub spx: Option<String>,  // spider x for reality
}

// Конфигурация для VMess
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VmessConfig {
    pub uuid: String,
    pub alter_id: u16,
    pub security: String,     // auto, aes-128-gcm, chacha20-poly1305
    pub network: String,      // tcp, ws, grpc
    pub tls: bool,
    pub sni: Option<String>,
    pub alpn: Option<Vec<String>>,
}

// Расширенная структура прокси-сервера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyServerV2 {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub port: u16,
    pub protocol: ProxyProtocol,
    pub config: ProxyConfig,
    pub latency_ms: Option<u32>,
    pub last_ping: Option<chrono::DateTime<chrono::Utc>>,
    pub active: bool,
    pub country: Option<String>,
    pub city: Option<String>,
    pub upload_speed: Option<u64>,
    pub download_speed: Option<u64>,
    pub subscription_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProxyConfig {
    Http,
    Https,
    Socks5,
    Vless(VlessConfig),
    Vmess(VmessConfig),
    Trojan { password: String },
    Shadowsocks { method: String, password: String },
}

// Структура подписки
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: String,
    pub name: String,
    pub url: String,
    pub update_interval: u32, // в часах
    pub last_update: Option<DateTime<Utc>>,
    pub servers_count: u32,
    pub active: bool,
    pub user_agent: Option<String>,
}