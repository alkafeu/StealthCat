import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Переводы
const translations = {
  ru: {
    // Навигация
    dashboard: 'Панель управления',
    rules: 'Правила фильтрации',
    configuration: 'Конфигурация',
    servers: 'Серверы',
    logs: 'Логи',
    settings: 'Настройки',
    
    // Dashboard
    trafficStats: 'Статистика трафика',
    activeConnections: 'Активные соединения',
    blockedRequests: 'Заблокированные запросы',
    serverStatus: 'Статус сервера',
    online: 'Онлайн',
    offline: 'Офлайн',
    
    // Rules
    filteringRules: 'Правила фильтрации',
    rulesManagement: 'Управление правилами маршрутизации трафика',
    addRule: 'Добавить правило',
    editRule: 'Редактировать правило',
    deleteRule: 'Удалить правило',
    ruleName: 'Название правила',
    ruleType: 'Тип правила',
    ruleAction: 'Действие',
    rulePattern: 'Шаблон',
    block: 'Блокировать',
    allow: 'Разрешить',
    redirect: 'Перенаправить',
    adBlocking: 'Блокировка рекламы',
    directConnection: 'Прямое соединение',
    
    // Settings
    settingsTitle: 'Настройки',
    settingsDescription: 'Конфигурация приложения и персонализация',
    appearance: 'Внешний вид',
    theme: 'Тема',
    themeDescription: 'Выберите светлую или тёмную тему',
    light: 'Светлая',
    dark: 'Тёмная',
    accentColor: 'Акцентный цвет',
    general: 'Общие',
    language: 'Язык интерфейса',
    autoStart: 'Автозапуск',
    autoStartDescription: 'Запускать приложение при старте системы',
    minimizeToTray: 'Сворачивать в трей',
    minimizeToTrayDescription: 'Сворачивать приложение в системный трей при закрытии',
    notifications: 'Уведомления',
    notificationsDescription: 'Показывать уведомления о событиях системы',
    autoUpdate: 'Автообновления',
    autoUpdateDescription: 'Автоматически проверять и устанавливать обновления',
    networkSettings: 'Сетевые настройки',
    proxyPort: 'Порт прокси',
    apiPort: 'Порт API',
    saveSettings: 'Сохранить настройки',
    reset: 'Сбросить',
    
    // Colors
    blue: 'Синий',
    purple: 'Фиолетовый',
    green: 'Зелёный',
    red: 'Красный',
    yellow: 'Жёлтый',
    pink: 'Розовый',
    indigo: 'Индиго',
    teal: 'Бирюзовый',
    orange: 'Оранжевый',
    
    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    add: 'Добавить',
    close: 'Закрыть',
    confirm: 'Подтвердить'
  },
  
  en: {
    // Navigation
    dashboard: 'Dashboard',
    rules: 'Filtering Rules',
    configuration: 'Configuration',
    servers: 'Servers',
    logs: 'Logs',
    settings: 'Settings',
    
    // Dashboard
    trafficStats: 'Traffic Statistics',
    activeConnections: 'Active Connections',
    blockedRequests: 'Blocked Requests',
    serverStatus: 'Server Status',
    online: 'Online',
    offline: 'Offline',
    
    // Rules
    filteringRules: 'Filtering Rules',
    rulesManagement: 'Traffic routing rules management',
    addRule: 'Add Rule',
    editRule: 'Edit Rule',
    deleteRule: 'Delete Rule',
    ruleName: 'Rule Name',
    ruleType: 'Rule Type',
    ruleAction: 'Action',
    rulePattern: 'Pattern',
    block: 'Block',
    allow: 'Allow',
    redirect: 'Redirect',
    adBlocking: 'Ad Blocking',
    directConnection: 'Direct Connection',
    
    // Settings
    settingsTitle: 'Settings',
    settingsDescription: 'Application configuration and personalization',
    appearance: 'Appearance',
    theme: 'Theme',
    themeDescription: 'Choose light or dark theme',
    light: 'Light',
    dark: 'Dark',
    accentColor: 'Accent Color',
    general: 'General',
    language: 'Interface Language',
    autoStart: 'Auto Start',
    autoStartDescription: 'Start application on system startup',
    minimizeToTray: 'Minimize to Tray',
    minimizeToTrayDescription: 'Minimize application to system tray when closed',
    notifications: 'Notifications',
    notificationsDescription: 'Show system event notifications',
    autoUpdate: 'Auto Updates',
    autoUpdateDescription: 'Automatically check and install updates',
    networkSettings: 'Network Settings',
    proxyPort: 'Proxy Port',
    apiPort: 'API Port',
    saveSettings: 'Save Settings',
    reset: 'Reset',
    
    // Colors
    blue: 'Blue',
    purple: 'Purple',
    green: 'Green',
    red: 'Red',
    yellow: 'Yellow',
    pink: 'Pink',
    indigo: 'Indigo',
    teal: 'Teal',
    orange: 'Orange',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    confirm: 'Confirm'
  },
  
  zh: {
    // Navigation
    dashboard: '仪表板',
    rules: '过滤规则',
    configuration: '配置',
    servers: '服务器',
    logs: '日志',
    settings: '设置',
    
    // Dashboard
    trafficStats: '流量统计',
    activeConnections: '活跃连接',
    blockedRequests: '被阻止的请求',
    serverStatus: '服务器状态',
    online: '在线',
    offline: '离线',
    
    // Rules
    filteringRules: '过滤规则',
    rulesManagement: '流量路由规则管理',
    addRule: '添加规则',
    editRule: '编辑规则',
    deleteRule: '删除规则',
    ruleName: '规则名称',
    ruleType: '规则类型',
    ruleAction: '动作',
    rulePattern: '模式',
    block: '阻止',
    allow: '允许',
    redirect: '重定向',
    adBlocking: '广告拦截',
    directConnection: '直接连接',
    
    // Settings
    settingsTitle: '设置',
    settingsDescription: '应用程序配置和个性化',
    appearance: '外观',
    theme: '主题',
    themeDescription: '选择浅色或深色主题',
    light: '浅色',
    dark: '深色',
    accentColor: '强调色',
    general: '常规',
    language: '界面语言',
    autoStart: '自动启动',
    autoStartDescription: '系统启动时启动应用程序',
    minimizeToTray: '最小化到托盘',
    minimizeToTrayDescription: '关闭时将应用程序最小化到系统托盘',
    notifications: '通知',
    notificationsDescription: '显示系统事件通知',
    autoUpdate: '自动更新',
    autoUpdateDescription: '自动检查和安装更新',
    networkSettings: '网络设置',
    proxyPort: '代理端口',
    apiPort: 'API端口',
    saveSettings: '保存设置',
    reset: '重置',
    
    // Colors
    blue: '蓝色',
    purple: '紫色',
    green: '绿色',
    red: '红色',
    yellow: '黄色',
    pink: '粉色',
    indigo: '靛蓝',
    teal: '青色',
    orange: '橙色',
    
    // Common
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    close: '关闭',
    confirm: '确认'
  }
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ru');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'ru';
    setLanguage(savedLanguage);
  }, []);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    availableLanguages: [
      { code: 'ru', name: 'Русский' },
      { code: 'en', name: 'English' },
      { code: 'zh', name: '中文' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};