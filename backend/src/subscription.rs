use crate::models::{ProxyServerV2, VlessConfig, VmessConfig, ProxyConfig, ProxyProtocol}; // Удаляем Subscription
use anyhow::{Result, anyhow};
use base64::{Engine as _, engine::general_purpose};
use regex::Regex;
use serde_json::Value;
use std::collections::HashMap;

pub struct SubscriptionParser;

impl SubscriptionParser {
    pub fn new() -> Self {
        Self
    }

    // Парсинг VLESS ссылки
    pub fn parse_vless_url(&self, url: &str) -> Result<ProxyServerV2> {
        let re = Regex::new(r"vless://([^@]+)@([^:]+):(\d+)\?(.*)#(.*)")?;
        
        if let Some(caps) = re.captures(url) {
            let uuid = caps.get(1).unwrap().as_str().to_string();
            let hostname = caps.get(2).unwrap().as_str().to_string();
            let port: u16 = caps.get(3).unwrap().as_str().parse()?;
            let params = caps.get(4).unwrap().as_str();
            let name = urlencoding::decode(caps.get(5).unwrap().as_str())?.to_string();

            let query_params = self.parse_query_params(params)?;
            
            let vless_config = VlessConfig {
                uuid,
                flow: query_params.get("flow").cloned(),
                encryption: query_params.get("encryption").unwrap_or(&"none".to_string()).clone(),
                network: query_params.get("type").unwrap_or(&"tcp".to_string()).clone(),
                security: query_params.get("security").unwrap_or(&"none".to_string()).clone(),
                sni: query_params.get("sni").cloned(),
                alpn: query_params.get("alpn").map(|s| s.split(',').map(|s| s.to_string()).collect()),
                fp: query_params.get("fp").cloned(),
                pbk: query_params.get("pbk").cloned(),
                sid: query_params.get("sid").cloned(),
                spx: query_params.get("spx").cloned(),
            };

            Ok(ProxyServerV2 {
                id: uuid::Uuid::new_v4().to_string(),
                name,
                hostname,
                port,
                protocol: ProxyProtocol::VLESS,
                config: ProxyConfig::Vless(vless_config),
                latency_ms: None,
                last_ping: None,
                active: false,
                country: None,
                city: None,
                upload_speed: None,
                download_speed: None,
                subscription_id: None, // Добавить эту строку
            })
        } else {
            Err(anyhow!("Invalid VLESS URL format"))
        }
    }

    // Парсинг VMess ссылки
    pub fn parse_vmess_url(&self, url: &str) -> Result<ProxyServerV2> {
        if !url.starts_with("vmess://") {
            return Err(anyhow!("Not a VMess URL"));
        }

        let encoded = &url[8..]; // Remove "vmess://"
        let decoded = general_purpose::STANDARD.decode(encoded)?;
        let json_str = String::from_utf8(decoded)?;
        let config: Value = serde_json::from_str(&json_str)?;

        let vmess_config = VmessConfig {
            uuid: config["id"].as_str().unwrap_or("").to_string(),
            alter_id: config["aid"].as_u64().unwrap_or(0) as u16,
            security: config["scy"].as_str().unwrap_or("auto").to_string(),
            network: config["net"].as_str().unwrap_or("tcp").to_string(),
            tls: config["tls"].as_str().unwrap_or("") == "tls",
            sni: config["sni"].as_str().map(|s| s.to_string()),
            alpn: config["alpn"].as_str().map(|s| s.split(',').map(|s| s.to_string()).collect()),
        };

        Ok(ProxyServerV2 {
            id: uuid::Uuid::new_v4().to_string(),
            name: config["ps"].as_str().unwrap_or("VMess Server").to_string(),
            hostname: config["add"].as_str().unwrap_or("").to_string(),
            port: config["port"].as_u64().unwrap_or(443) as u16,
            protocol: ProxyProtocol::VMess,
            config: ProxyConfig::Vmess(vmess_config),
            latency_ms: None,
            last_ping: None,
            active: false,
            country: None,
            city: None,
            upload_speed: None,
            download_speed: None,
            subscription_id: None, // Добавить эту строку
        })
    }

    // Загрузка и парсинг подписки
    pub async fn fetch_subscription(&self, url: &str) -> Result<Vec<ProxyServerV2>> {
        let client = reqwest::Client::new();
        let response = client
            .get(url)
            .header("User-Agent", "ClashforWindows/0.20.39")
            .send()
            .await?;

        let content = response.text().await?;
        
        // Попытка декодировать как base64
        let decoded_content = if let Ok(decoded) = general_purpose::STANDARD.decode(&content) {
            String::from_utf8(decoded)?
        } else {
            content
        };

        let mut servers = Vec::new();
        
        for line in decoded_content.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }

            if line.starts_with("vless://") {
                if let Ok(server) = self.parse_vless_url(line) {
                    servers.push(server);
                }
            } else if line.starts_with("vmess://") {
                if let Ok(server) = self.parse_vmess_url(line) {
                    servers.push(server);
                }
            }
            // Добавить поддержку других протоколов...
        }

        Ok(servers)
    }

    fn parse_query_params(&self, params: &str) -> Result<HashMap<String, String>> {
        let mut map = HashMap::new();
        
        for param in params.split('&') {
            if let Some((key, value)) = param.split_once('=') {
                map.insert(
                    urlencoding::decode(key)?.to_string(),
                    urlencoding::decode(value)?.to_string()
                );
            }
        }
        
        Ok(map)
    }
}
