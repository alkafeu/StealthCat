import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, MagnifyingGlass, Funnel, Download } from 'phosphor-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, levelFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/logs');
      const data = await response.json();
      // Если данных нет, показываем демо-данные
      if (!Array.isArray(data) || data.length === 0) {
        // Демо данные для разработки
        setLogs([
          {
            id: 1,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Прокси сервер запущен на порту 8080',
            source: 'proxy'
          },
          {
            id: 2,
            timestamp: new Date(Date.now() - 30000).toISOString(),
            level: 'info',
            message: 'Новое подключение от клиента 192.168.1.100',
            source: 'proxy'
          },
          {
            id: 3,
            timestamp: new Date(Date.now() - 60000).toISOString(),
            level: 'warning',
            message: 'Высокая нагрузка на сервер (CPU: 85%)',
            source: 'monitor'
          },
          {
            id: 4,
            timestamp: new Date(Date.now() - 90000).toISOString(),
            level: 'info',
            message: 'Успешная аутентификация пользователя admin',
            source: 'auth'
          },
          {
            id: 5,
            timestamp: new Date(Date.now() - 120000).toISOString(),
            level: 'error',
            message: 'Ошибка подключения к серверу upstream: connection timeout',
            source: 'proxy'
          },
          {
            id: 6,
            timestamp: new Date(Date.now() - 150000).toISOString(),
            level: 'debug',
            message: 'Обработка HTTP запроса: GET /api/status',
            source: 'api'
          },
          {
            id: 7,
            timestamp: new Date(Date.now() - 180000).toISOString(),
            level: 'warning',
            message: 'Превышен лимит запросов для IP 192.168.1.50',
            source: 'ratelimit'
          },
          {
            id: 8,
            timestamp: new Date(Date.now() - 210000).toISOString(),
            level: 'info',
            message: 'Конфигурация успешно перезагружена',
            source: 'config'
          },
          {
            id: 9,
            timestamp: new Date(Date.now() - 240000).toISOString(),
            level: 'error',
            message: 'Ошибка записи в базу данных: disk full',
            source: 'database'
          },
          {
            id: 10,
            timestamp: new Date(Date.now() - 270000).toISOString(),
            level: 'info',
            message: 'Запуск процедуры очистки временных файлов',
            source: 'cleanup'
          }
        ]);
      } else {
        setLogs(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки логов:', error);
      // Демо данные для разработки
      setLogs([
        {
          id: 1,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Прокси сервер запущен на порту 8080',
          source: 'proxy'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'info',
          message: 'Новое подключение от клиента 192.168.1.100',
          source: 'proxy'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warning',
          message: 'Высокая нагрузка на сервер (CPU: 85%)',
          source: 'monitor'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 90000).toISOString(),
          level: 'info',
          message: 'Успешная аутентификация пользователя admin',
          source: 'auth'
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'error',
          message: 'Ошибка подключения к серверу upstream: connection timeout',
          source: 'proxy'
        },
        {
          id: 6,
          timestamp: new Date(Date.now() - 150000).toISOString(),
          level: 'debug',
          message: 'Обработка HTTP запроса: GET /api/status',
          source: 'api'
        },
        {
          id: 7,
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'warning',
          message: 'Превышен лимит запросов для IP 192.168.1.50',
          source: 'ratelimit'
        },
        {
          id: 8,
          timestamp: new Date(Date.now() - 210000).toISOString(),
          level: 'info',
          message: 'Конфигурация успешно перезагружена',
          source: 'config'
        },
        {
          id: 9,
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'error',
          message: 'Ошибка записи в базу данных: disk full',
          source: 'database'
        },
        {
          id: 10,
          timestamp: new Date(Date.now() - 270000).toISOString(),
          level: 'info',
          message: 'Запуск процедуры очистки временных файлов',
          source: 'cleanup'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    if (!Array.isArray(logs)) {
      setFilteredLogs([]);
      return;
    }
    
    let filtered = logs;
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }
    
    setFilteredLogs(filtered);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'debug': return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Логи системы
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Мониторинг событий и ошибок прокси-сервера
        </p>
      </div>

      {/* Фильтры */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск в логах..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Все уровни</option>
          <option value="error">Ошибки</option>
          <option value="warning">Предупреждения</option>
          <option value="info">Информация</option>
          <option value="debug">Отладка</option>
        </select>
        <button className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-600 transition-colors flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Экспорт</span>
        </button>
      </div>

      {/* Список логов */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-2">
          {Array.isArray(filteredLogs) && filteredLogs.map((log, index) => (
            <motion.div
              key={log.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {log.source}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {log.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Логи не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || levelFilter !== 'all' 
                ? 'Попробуйте изменить фильтры поиска'
                : 'Логи появятся здесь при работе системы'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;