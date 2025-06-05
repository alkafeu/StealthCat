use serde_yaml;
use serde_json;
use std::fs;
use crate::models::*;

pub struct ConfigManager;

impl ConfigManager {
    pub fn load_from_file(path: &str) -> Result<MihomoConfig, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let format = if path.ends_with(".yaml") || path.ends_with(".yml") {
            ConfigFormat::YAML
        } else {
            ConfigFormat::JSON
        };

        // Validate config
        match format {
            ConfigFormat::YAML => {
                serde_yaml::from_str::<serde_yaml::Value>(&content)?;
            }
            ConfigFormat::JSON => {
                serde_json::from_str::<serde_json::Value>(&content)?;
            }
        }

        Ok(MihomoConfig {
            raw_config: content,
            format,
            last_modified: chrono::Utc::now(),
        })
    }

    pub fn save_to_file(config: &MihomoConfig, path: &str) -> Result<(), Box<dyn std::error::Error>> {
        fs::write(path, &config.raw_config)?;
        Ok(())
    }

    pub fn get_default_config() -> MihomoConfig {
        let default_yaml = r#"
port: 7890
socks-port: 7891
allow-lan: false
mode: Rule
log-level: info
external-controller: 127.0.0.1:9090

proxies:
  - name: "example-server"
    type: ss
    server: example.com
    port: 443
    cipher: aes-256-gcm
    password: password

proxy-groups:
  - name: "Proxy"
    type: select
    proxies:
      - "example-server"
      - DIRECT

rules:
  - DOMAIN-SUFFIX,google.com,Proxy
  - DOMAIN-KEYWORD,github,Proxy
  - GEOIP,CN,DIRECT
  - MATCH,Proxy
"#;

        MihomoConfig {
            raw_config: default_yaml.to_string(),
            format: ConfigFormat::YAML,
            last_modified: chrono::Utc::now(),
        }
    }
}