use std::net::SocketAddr;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use crate::models::*;
use anyhow::Result;

pub struct ProxyEngine {
    pub config: MihomoConfig,
    pub servers: Vec<ProxyServer>,
    pub rules: Vec<Rule>,
}

impl ProxyEngine {
    pub fn new() -> Self {
        Self {
            config: MihomoConfig {
                raw_config: String::new(),
                format: ConfigFormat::YAML,
                last_modified: chrono::Utc::now(),
            },
            servers: vec![],
            rules: vec![],
        }
    }

    pub async fn start_proxy_server(&self, addr: SocketAddr) -> Result<()> {
        let listener = TcpListener::bind(addr).await?;
        log::info!("🔗 Proxy server listening on {}", addr);

        loop {
            let (stream, client_addr) = listener.accept().await?;
            let servers = self.servers.clone();
            let rules = self.rules.clone();
            
            tokio::spawn(async move {
                if let Err(e) = handle_connection(stream, client_addr, servers, rules).await {
                    log::error!("Error handling connection from {}: {}", client_addr, e);
                }
            });
        }
    }

    pub async fn ping_server(&self, server: &ProxyServer) -> Result<u32> {
        let start = std::time::Instant::now();
        let addr = format!("{}:{}", server.hostname, server.port);
        
        match TcpStream::connect(&addr).await {
            Ok(_) => {
                let latency = start.elapsed().as_millis() as u32;
                Ok(latency)
            }
            Err(e) => Err(anyhow::anyhow!("Failed to connect to {}: {}", addr, e)),
        }
    }

    pub fn find_matching_rule(&self, host: &str, port: u16) -> Option<&Rule> {
        for rule in &self.rules {
            if self.rule_matches(rule, host, port) {
                return Some(rule);
            }
        }
        None
    }

    fn rule_matches(&self, rule: &Rule, host: &str, port: u16) -> bool {
        if !rule.enabled {
            return false;
        }
        
        match rule.rule_type.as_str() {
            "domain" => rule.pattern == host,
            "domain-suffix" => host.ends_with(&rule.pattern),
            "domain-keyword" => host.contains(&rule.pattern),
            "ip-cidr" => {
                // Простая проверка IP (можно улучшить)
                host.parse::<std::net::IpAddr>().is_ok() && host.starts_with(&rule.pattern.split('/').next().unwrap_or(""))
            },
            "dst-port" => {
                rule.pattern.parse::<u16>().map_or(false, |p| p == port)
            },
            _ => false,
        }
    }
}

async fn handle_connection(
    mut stream: TcpStream,
    client_addr: SocketAddr,
    _servers: Vec<ProxyServer>,
    _rules: Vec<Rule>,
) -> Result<()> {
    let mut buffer = [0; 4096];
    let n = stream.read(&mut buffer).await?;
    
    let request = String::from_utf8_lossy(&buffer[..n]);
    let lines: Vec<&str> = request.lines().collect();
    
    if lines.is_empty() {
        return Err(anyhow::anyhow!("Empty request"));
    }

    let first_line = lines[0];
    log::info!("Request from {}: {}", client_addr, first_line);

    // Парсинг HTTP запроса
    if first_line.starts_with("CONNECT") {
        handle_connect_request(&mut stream, first_line).await
    } else if first_line.starts_with("GET") || first_line.starts_with("POST") {
        handle_http_request(&mut stream, &request).await
    } else {
        // Неподдерживаемый метод
        let response = "HTTP/1.1 405 Method Not Allowed\r\n\r\n";
        stream.write_all(response.as_bytes()).await?;
        Ok(())
    }
}

async fn handle_connect_request(
    stream: &mut TcpStream,
    connect_line: &str,
) -> Result<()> {
    // Парсинг CONNECT запроса
    let parts: Vec<&str> = connect_line.split_whitespace().collect();
    if parts.len() < 2 {
        return Err(anyhow::anyhow!("Invalid CONNECT request"));
    }

    let target = parts[1];
    let (host, port) = parse_host_port(target)?;

    log::info!("CONNECT request to {}:{}", host, port);

    // Прямое подключение к целевому серверу
    let target_addr = format!("{}:{}", host, port);

    // Подключение к целевому серверу
    match TcpStream::connect(&target_addr).await {
        Ok(mut target_stream) => {
            // Отправляем успешный ответ клиенту
            let response = "HTTP/1.1 200 Connection Established\r\n\r\n";
            stream.write_all(response.as_bytes()).await?;

            // Начинаем туннелирование
            let (mut client_read, mut client_write) = stream.split();
            let (mut target_read, mut target_write) = target_stream.split();

            let client_to_target = tokio::io::copy(&mut client_read, &mut target_write);
            let target_to_client = tokio::io::copy(&mut target_read, &mut client_write);

            // Ждем завершения любого из направлений
            tokio::select! {
                result = client_to_target => {
                    if let Err(e) = result {
                        log::warn!("Client to target copy error: {}", e);
                    }
                },
                result = target_to_client => {
                    if let Err(e) = result {
                        log::warn!("Target to client copy error: {}", e);
                    }
                }
            }

            log::info!("CONNECT tunnel closed for {}:{}", host, port);
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to connect to {}: {}", target_addr, e);
            let response = "HTTP/1.1 502 Bad Gateway\r\n\r\n";
            stream.write_all(response.as_bytes()).await?;
            Err(anyhow::anyhow!("Connection failed: {}", e))
        }
    }
}

async fn handle_http_request(
    stream: &mut TcpStream,
    request: &str,
) -> Result<()> {
    // Простая HTTP прокси логика
    log::info!("HTTP request: {}", request.lines().next().unwrap_or(""));
    
    // Пока что возвращаем простой ответ
    let response = "HTTP/1.1 200 OK\r\nContent-Length: 13\r\n\r\nProxy working";
    stream.write_all(response.as_bytes()).await?;
    
    Ok(())
}

fn parse_host_port(target: &str) -> Result<(String, u16)> {
    if let Some(colon_pos) = target.rfind(':') {
        let host = target[..colon_pos].to_string();
        let port = target[colon_pos + 1..].parse::<u16>()
            .map_err(|_| anyhow::anyhow!("Invalid port number"))?;
        Ok((host, port))
    } else {
        // Если порт не указан, используем 80 для HTTP
        Ok((target.to_string(), 80))
    }
}