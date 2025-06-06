mod api;
mod config;
mod models;
mod proxy;
mod websocket;
mod database;
mod subscription; // Добавить эту строку

use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use std::sync::Arc;
use tokio::sync::RwLock; // Изменено с Mutex на RwLock
use crate::models::AppState;
use crate::database::Database;
use anyhow::Result;

#[actix_web::main]
async fn main() -> Result<()> {
    env_logger::init();
    
    // Инициализация базы данных
    let database = Database::new("sqlite:data/stealthcat.db").await?;
    let db = Arc::new(database);
    
    // Создание состояния приложения
    let app_state = Arc::new(RwLock::new(AppState::new())); // Изменено с Mutex на RwLock
    
    log::info!("🐱 Starting StealthCat backend server...");
    
    // Запуск прокси-сервера в отдельной задаче
    let proxy_engine = proxy::ProxyEngine::new();
    let proxy_addr = "127.0.0.1:8081".parse().unwrap();
    
    tokio::spawn(async move {
        if let Err(e) = proxy_engine.start_proxy_server(proxy_addr).await {
            log::error!("Proxy server error: {}", e);
        }
    });
    
    // Запуск HTTP API сервера
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();
            
        App::new()
            .app_data(web::Data::new(app_state.clone()))
            .app_data(web::Data::new(db.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api")
                    .route("/status", web::get().to(api::get_status))
                    .route("/stats", web::get().to(api::get_stats))
                    .route("/servers", web::get().to(api::get_servers))
                    .route("/config", web::get().to(api::get_config))
                    .route("/config", web::post().to(api::update_config))
                    .route("/logs", web::get().to(api::get_logs))
                    .route("/rules", web::get().to(api::get_rules))
                    .route("/rules", web::post().to(api::create_rule))
                    .route("/rules/{id}", web::put().to(api::update_rule))
                    .route("/rules/{id}", web::delete().to(api::delete_rule))
                    // Маршруты для серверов
                    .route("/servers", web::post().to(api::create_server))
                    .route("/servers/{id}", web::put().to(api::update_server))
                    .route("/servers/{id}", web::delete().to(api::delete_server))
                    // Новые маршруты для подписок
                    .route("/subscriptions", web::get().to(api::get_subscriptions))
                    .route("/subscriptions", web::post().to(api::create_subscription))
                    .route("/subscriptions/{id}", web::get().to(api::get_subscription))
                    .route("/subscriptions/{id}", web::put().to(api::update_subscription))
                    .route("/subscriptions/{id}", web::delete().to(api::delete_subscription))
                    .route("/subscriptions/{id}/update", web::post().to(api::update_subscription_servers))
                    // ✅ ДОБАВИТЬ ЭТИ МАРШРУТЫ:
                    .route("/servers-v2", web::get().to(api::get_servers_v2))
                    .route("/servers-v2", web::post().to(api::create_server))     // ← ИСПРАВИТЬ: использовать create_server
                    .route("/servers-v2/{id}", web::put().to(api::update_server))    // ← ДОБАВИТЬ
                    .route("/servers-v2/{id}", web::delete().to(api::delete_server)) // ← ДОБАВИТЬ
                    .route("/servers-v2/{id}/test", web::post().to(api::test_server_speed))
                    .route("/select-server", web::post().to(api::select_server))
            )
            .route("/ws", web::get().to(websocket::websocket_handler))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await?;
    
    Ok(())
}