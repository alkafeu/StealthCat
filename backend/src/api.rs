use actix_web::{web, HttpResponse, Result};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::models::*;
use crate::subscription::SubscriptionParser;
use crate::models::Subscription;
use crate::database::Database;
use crate::models::{ProxyServerV2, ProxyProtocol, ProxyConfig};
use uuid;

pub async fn get_status(
    data: web::Data<Arc<RwLock<AppState>>>,
) -> Result<HttpResponse> {
    let state = data.read().await;
    let response = ApiResponse {
        success: true,
        data: Some(json!({
            "connected": state.proxy_status.connected,
            "mode": state.proxy_status.mode,
            "uptime": state.proxy_status.uptime,
            "current_server": state.current_server,
            "last_error": state.proxy_status.last_error
        })),
        error: None,
    };
    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_stats(
    data: web::Data<Arc<RwLock<AppState>>>,
) -> Result<HttpResponse> {
    let state = data.read().await;
    let response = ApiResponse {
        success: true,
        data: Some(json!({
            "bytes_up": state.stats.bytes_up,
            "bytes_down": state.stats.bytes_down,
            "active_connections": state.stats.active_connections,
            "total_requests": state.stats.total_requests
        })),
        error: None,
    };
    Ok(HttpResponse::Ok().json(response))
}

// ❌ УДАЛИТЬ МЕТОД (строки 42-50)
// pub async fn get_servers(
//     data: web::Data<Arc<RwLock<AppState>>>,
// ) -> Result<HttpResponse> {
//     let state = data.read().await;
//     let response = ApiResponse {
//         success: true,
//         data: Some(json!(state.servers)),
//         error: None,
//     };
//     Ok(HttpResponse::Ok().json(response))
// }

pub async fn select_server(
    data: web::Data<Arc<RwLock<AppState>>>,
    payload: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let server_id = payload.get("server_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| actix_web::error::ErrorBadRequest("Missing server_id"))?;
    
    let mut state = data.write().await;
    state.current_server = Some(server_id.to_string());
    
    let response = ApiResponse {
        success: true,
        data: Some(json!({"message": "Server selected successfully"})),
        error: None,
    };
    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_config(
    data: web::Data<Arc<RwLock<AppState>>>,
) -> Result<HttpResponse> {
    let state = data.read().await;
    let response = ApiResponse {
        success: true,
        data: Some(json!({
            "config": state.config.raw_config,
            "format": state.config.format,
            "last_modified": state.config.last_modified
        })),
        error: None,
    };
    Ok(HttpResponse::Ok().json(response))
}

pub async fn update_config(
    data: web::Data<Arc<RwLock<AppState>>>,
    payload: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let config_text = payload.get("config")
        .and_then(|v| v.as_str())
        .ok_or_else(|| actix_web::error::ErrorBadRequest("Missing config"))?;
    
    let mut state = data.write().await;
    state.config.raw_config = config_text.to_string();
    state.config.last_modified = chrono::Utc::now();
    
    let response = ApiResponse {
        success: true,
        data: Some(json!({"message": "Configuration updated successfully"})),
        error: None,
    };
    Ok(HttpResponse::Ok().json(response))
}

// ✅ ОСТАВЛЯЕМ ЭТУ ФУНКЦИЮ
pub async fn get_servers(
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    match db.get_servers_v2().await { // Используем get_servers_v2
        Ok(servers) => {
            let response = ApiResponse {
                success: true,
                data: Some(servers),
                error: None,
            };
            Ok(HttpResponse::Ok().json(response))
        },
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(ApiError {
                    code: 500,
                    message: format!("Failed to get servers: {}", e),
                }),
            }))
        }
    }
}

pub async fn get_logs(
    db: web::Data<Arc<Database>>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse> {
    let limit = query.get("limit")
        .and_then(|l| l.parse::<i32>().ok());
    
    match db.get_logs(limit).await {
        Ok(logs) => {
            let response = ApiResponse {
                success: true,
                data: Some(logs),
                error: None,
            };
            Ok(HttpResponse::Ok().json(response))
        },
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(ApiError {
                    code: 500,
                    message: format!("Failed to get logs: {}", e),
                }),
            }))
        }
    }
}

pub async fn get_rules(
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    match db.get_rules().await {
        Ok(rules) => {
            let response = ApiResponse {
                success: true,
                data: Some(rules),
                error: None,
            };
            Ok(HttpResponse::Ok().json(response))
        },
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(ApiError {
                    code: 500,
                    message: format!("Failed to get rules: {}", e),
                }),
            }))
        }
    }
}

pub async fn create_rule(
    payload: web::Json<serde_json::Value>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    let rule = Rule {
        id: "0".to_string(), // Будет установлен автоматически
        name: payload.get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("Unnamed Rule")
            .to_string(),
        rule_type: payload.get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("domain")
            .to_string(),
        pattern: payload.get("pattern")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        action: payload.get("action")
            .and_then(|v| v.as_str())
            .unwrap_or("proxy")
            .to_string(),
        priority: payload.get("priority")
            .and_then(|v| v.as_i64())
            .unwrap_or(1) as i32,
        enabled: payload.get("enabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(true),
    };
    
    match db.insert_rule(&rule).await {
        Ok(_) => {
            let response = ApiResponse {
                success: true,
                data: Some(json!({"message": "Rule created successfully"})),
                error: None,
            };
            Ok(HttpResponse::Created().json(response))
        },
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(ApiError {
                    code: 500,
                    message: format!("Failed to create rule: {}", e),
                }),
            }))
        }
    }
}

pub async fn update_rule(
    db: web::Data<Arc<Database>>,
    path: web::Path<String>, // Изменяем с u32 на String
    rule_data: web::Json<Rule>,
) -> Result<HttpResponse> {
    let rule_id = path.into_inner();
    let mut rule = rule_data.into_inner();
    rule.id = rule_id;
    
    match db.update_rule(&rule).await {
        Ok(_) => {
            let response = ApiResponse {
                success: true,
                data: Some(json!({"message": "Rule updated successfully"})),
                error: None,
            };
            Ok(HttpResponse::Ok().json(response))
        },
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(ApiError {
                    code: 500,
                    message: format!("Failed to update rule: {}", e),
                }),
            }))
        }
    }
}

pub async fn delete_rule(
    db: web::Data<Arc<Database>>, // Убираем подчеркивание
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let rule_id = path.into_inner();
    
    match db.delete_rule(&rule_id).await { // Передаем ссылку на String
        Ok(_) => {
            let response = ApiResponse {
                success: true,
                data: Some(json!({"message": "Rule deleted successfully"})),
                error: None,
            };
            Ok(HttpResponse::Ok().json(response))
        },
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(ApiError {
                    code: 500,
                    message: format!("Failed to delete rule: {}", e),
                }),
            }))
        }
    }
}

// Получение всех подписок
pub async fn get_subscriptions(
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, actix_web::Error> {
    match db.get_subscriptions().await {
        Ok(subscriptions) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(subscriptions),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to get subscriptions: {}", e),
            }),
        })),
    }
}

// Создание новой подписки
pub async fn create_subscription(
    subscription: web::Json<Subscription>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, actix_web::Error> {
    match db.create_subscription(&subscription).await {
        Ok(id) => Ok(HttpResponse::Created().json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({"id": id})),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to create subscription: {}", e),
            }),
        })),
    }
}

// Получение конкретной подписки
pub async fn get_subscription(
    path: web::Path<String>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, actix_web::Error> {
    let subscription_id = path.into_inner();
    
    match db.get_subscription(&subscription_id).await {
        Ok(Some(subscription)) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(subscription),
            error: None,
        })),
        Ok(None) => Ok(HttpResponse::NotFound().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 404,
                message: "Subscription not found".to_string(),
            }),
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to get subscription: {}", e),
            }),
        })),
    }
}

// Обновление серверов подписки
pub async fn update_subscription_servers(
    path: web::Path<String>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, actix_web::Error> {
    let subscription_id = path.into_inner();
    
    // Получаем подписку
    match db.get_subscription(&subscription_id).await {
        Ok(Some(subscription)) => {
            // Парсим подписку
            let parser = SubscriptionParser::new();
            match parser.fetch_subscription(&subscription.url).await {
                Ok(servers) => {
                    // Обновляем серверы в базе данных
                    match db.update_subscription_servers(&subscription_id, &servers).await {
                        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse {
                            success: true,
                            data: Some(serde_json::json!({
                                "updated_servers": servers.len(),
                                "subscription_id": subscription_id
                            })),
                            error: None,
                        })),
                        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                            success: false,
                            data: None,
                            error: Some(ApiError {
                                code: 500,
                                message: format!("Failed to update servers: {}", e),
                            }),
                        })),
                    }
                },
                Err(e) => Ok(HttpResponse::BadRequest().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    error: Some(ApiError {
                        code: 400,
                        message: format!("Failed to fetch subscription: {}", e),
                    }),
                })),
            }
        },
        Ok(None) => Ok(HttpResponse::NotFound().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 404,
                message: "Subscription not found".to_string(),
            }),
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to get subscription: {}", e),
            }),
        })),
    }
}

// Получение серверов V2
pub async fn get_servers_v2(
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, actix_web::Error> {
    match db.get_servers_v2().await {
        Ok(servers) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(servers),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to get servers: {}", e),
            }),
        })),
    }
}

// Удалить подписку
pub async fn delete_subscription(
    path: web::Path<String>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, actix_web::Error> {
    let subscription_id = path.into_inner();
    
    match db.delete_subscription(&subscription_id).await {
        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some("Subscription deleted successfully"),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to delete subscription: {}", e),
            }),
        })),
    }
}

// Тестирование скорости сервера
pub async fn test_server_speed(
    path: web::Path<String>,
    _db: web::Data<Arc<Database>>, // Добавляем подчеркивание перед именем
) -> Result<HttpResponse, actix_web::Error> {
    let server_id = path.into_inner();
    
    // Здесь будет логика тестирования скорости
    // Пока что возвращаем заглушку
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "server_id": server_id,
            "latency_ms": 42,
            "download_speed": 1024000, // 1 MB/s
            "upload_speed": 512000     // 512 KB/s
        })),
        error: None,
    }))
}

// Обновление подписки
pub async fn update_subscription(
    path: web::Path<String>,
    subscription: web::Json<Subscription>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, actix_web::Error> {
    let subscription_id = path.into_inner();
    
    // Проверяем, что ID в пути совпадает с ID в теле запроса
    if subscription.id != subscription_id {
        return Ok(HttpResponse::BadRequest().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 400,
                message: "Subscription ID mismatch".to_string(),
            }),
        }));
    }
    
    match db.update_subscription(&subscription).await {
        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some("Subscription updated successfully"),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to update subscription: {}", e),
            }),
        })),
    }
}

pub async fn create_server(
    payload: web::Json<UpdateProxyServer>, // Изменяем на UpdateProxyServer
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    let update_data = payload.into_inner();
    
    // Создаем ProxyServer с автогенерированным ID
    // Вместо создания ProxyServer создаем ProxyServerV2
    let server = ProxyServerV2 {
        id: uuid::Uuid::new_v4().to_string(),
        name: update_data.name,
        hostname: update_data.hostname,  // Исправлено: hostname вместо host
        port: update_data.port,
        protocol: match update_data.protocol.as_str() {
            "HTTP" => ProxyProtocol::HTTP,
            "HTTPS" => ProxyProtocol::HTTPS,
            "SOCKS5" => ProxyProtocol::SOCKS5,
            "VLESS" => ProxyProtocol::VLESS,
            "VMess" => ProxyProtocol::VMess,
            "Trojan" => ProxyProtocol::Trojan,
            "Shadowsocks" => ProxyProtocol::Shadowsocks,
            _ => ProxyProtocol::HTTP,
        },
        config: ProxyConfig::Http, // Временная заглушка, будет заменена в insert_server_v2
        latency_ms: None,
        last_ping: None,
        active: update_data.active,
        country: None,
        city: None,
        upload_speed: None,
        download_speed: None,
        subscription_id: None,
    };

    match db.insert_server_v2(&server).await { // Используем insert_server_v2
        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some("Server created successfully"),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to create server: {}", e),
            }),
        })),
    }
}

pub async fn update_server(
    db: web::Data<Arc<Database>>,
    path: web::Path<String>,
    server_data: web::Json<UpdateProxyServerV2>,  // ✅ Изменено на V2
) -> Result<HttpResponse> {
    let server_id = path.into_inner();
    let update_data = server_data.into_inner();
    
    // Создаем полную структуру ProxyServerV2 с ID из URL
    let server = ProxyServerV2 {
        id: server_id,
        name: update_data.name,
        hostname: update_data.hostname,
        port: update_data.port,
        protocol: update_data.protocol,
        config: update_data.config,
        latency_ms: update_data.latency_ms,
        last_ping: update_data.last_ping.map(|s| chrono::DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&chrono::Utc)),
        active: update_data.active,
        country: update_data.country,
        city: update_data.city,
        upload_speed: update_data.upload_speed,
        download_speed: update_data.download_speed,
        subscription_id: update_data.subscription_id,
    };

    match db.update_server(&server).await {
        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some("Server updated successfully"),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to update server: {}", e),
            }),
        })),
    }
}

pub async fn delete_server(
    db: web::Data<Arc<Database>>,
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let server_id = path.into_inner();

    match db.delete_server(&server_id).await {
        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some("Server deleted successfully"),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(ApiError {
                code: 500,
                message: format!("Failed to delete server: {}", e),
            }),
        })),
    }
}