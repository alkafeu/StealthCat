import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUp,
  ArrowDown,
  Globe,
  Shield,
  Activity,
  Users
} from 'phosphor-react';
import TrafficChart from '../components/TrafficChart';
import StatusCard from '../components/StatusCard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    bytesUp: 0,
    bytesDown: 0,
    activeConnections: 0,
    totalRequests: 0
  });
  const [proxyMode, setProxyMode] = useState('Global');
  const [isConnected, setIsConnected] = useState(false);
  
  // Используем useRef для хранения WebSocket
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Fetch initial data
    fetchStats();
    fetchStatus();

    let isComponentMounted = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      // Проверяем, что компонент еще смонтирован
      if (!isComponentMounted) return;
      
      // Закрываем предыдущее соединение если есть
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
      
      console.log('🔄 Подключение к WebSocket...');
      wsRef.current = new WebSocket('ws://localhost:8080/ws');
      
      wsRef.current.onopen = () => {
        if (!isComponentMounted) {
          wsRef.current.close();
          return;
        }
        console.log('✅ WebSocket подключен успешно');
        reconnectAttempts = 0; // Сбрасываем счетчик попыток
        setIsConnected(true);
      };
      
      wsRef.current.onmessage = (event) => {
        if (!isComponentMounted) return;
        
        console.log('📨 Получено сообщение:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status_update') {
            setStats(prevStats => ({
              ...prevStats,
              bytesUp: data.payload.bytes_up || 0,
              bytesDown: data.payload.bytes_down || 0,
              activeConnections: data.payload.active_connections || 0,
              totalRequests: prevStats.totalRequests + 1 // Увеличиваем счетчик
            }));
            setIsConnected(data.payload.connected || false);
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга JSON:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Ошибка WebSocket:', error);
        if (isComponentMounted) {
          setIsConnected(false);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log(`🔌 WebSocket закрыт: код ${event.code}, причина: ${event.reason || 'неизвестно'}`);
        
        if (!isComponentMounted) {
          console.log('🏠 Компонент размонтирован, переподключение отменено');
          return;
        }
        
        setIsConnected(false);
        
        // Переподключение при аномальном закрытии
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Экспоненциальная задержка
          
          console.log(`🔄 Попытка переподключения ${reconnectAttempts}/${maxReconnectAttempts} через ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isComponentMounted) {
              connectWebSocket();
            }
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('❌ Превышено максимальное количество попыток переподключения');
        }
      };
    };
    
    // Подключаемся только если еще нет активного соединения
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      connectWebSocket();
    }
    
    // Cleanup функция
    return () => {
      console.log('🧹 Очистка WebSocket соединения...');
      isComponentMounted = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, []); // Пустой массив зависимостей важен!

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/status');
      const data = await response.json();
      if (data.success) {
        setIsConnected(data.data.connected);
        setProxyMode(data.data.mode);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleProxy = async () => {
    // Toggle proxy logic
    setIsConnected(!isConnected);
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Панель управления
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Мониторинг и управление прокси-соединением
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="Статус подключения"
            value={isConnected ? 'Подключено' : 'Отключено'}
            icon={Globe}
            color={isConnected ? 'green' : 'red'}
            onClick={toggleProxy}
          />
          <StatusCard
            title="Режим прокси"
            value={proxyMode}
            icon={Shield}
            color="blue"
          />
          <StatusCard
            title="Активные соединения"
            value={stats.activeConnections || 0}
            icon={Users}
            color="purple"
          />
          <StatusCard
            title="Всего запросов"
            value={stats.totalRequests || 0}
            icon={Activity}
            color="orange"
          />
        </div>

        {/* Traffic Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Исходящий трафик
              </h3>
              <ArrowUp className="text-green-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-green-500">
              {formatBytes(stats.bytesUp)}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Входящий трафик
              </h3>
              <ArrowDown className="text-blue-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-blue-500">
              {formatBytes(stats.bytesDown)}
            </p>
          </motion.div>
        </div>

        {/* Traffic Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            График трафика
          </h3>
          <TrafficChart />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;