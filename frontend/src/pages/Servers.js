import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Circle, Clock, Globe } from 'phosphor-react';

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/servers');
      const data = await response.json();
      // Убедимся что data это массив
      setServers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки серверов:', error);
      // Установим пустой массив при ошибке
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Онлайн';
      case 'offline': return 'Офлайн';
      case 'warning': return 'Предупреждение';
      default: return 'Неизвестно';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Управление серверами
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Мониторинг и управление прокси-серверами
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(servers) && servers.map((server, index) => (
          <motion.div
            key={server.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Database className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {server.name || `Сервер ${index + 1}`}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {server.address || 'localhost:8080'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${getStatusColor(server.status || 'online')}`}>
                <Circle className="w-3 h-3 fill-current" />
                <span className="text-sm font-medium">
                  {getStatusText(server.status || 'online')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Пинг:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {server.ping || '12'}ms
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Подключения:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {server.connections || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Время работы:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {server.uptime || '0h 0m'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                // Заменить все bg-blue-500 на bg-accent
                <button className="flex-1 px-3 py-2 text-sm bg-accent text-white rounded-md hover:bg-accent transition-colors">
                  Подключить
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Настройки
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {servers.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Серверы не найдены
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Добавьте серверы для начала работы с прокси
          </p>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
            Добавить сервер
          </button>
        </div>
      )}
    </div>
  );
};

export default Servers;