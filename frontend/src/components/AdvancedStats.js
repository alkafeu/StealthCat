import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendUp, Clock, Globe, Shield } from 'phosphor-react';
import { Doughnut, Bar } from 'react-chartjs-2';

const AdvancedStats = () => {
  const [stats, setStats] = useState({
    responseTime: [],
    countryStats: {},
    protocolStats: {},
    hourlyTraffic: []
  });

  useEffect(() => {
    fetchAdvancedStats();
    const interval = setInterval(fetchAdvancedStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdvancedStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/stats/advanced');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Ошибка загрузки расширенной статистики:', error);
    }
  };

  const protocolChartData = {
    labels: Object.keys(stats.protocolStats),
    datasets: [{
      data: Object.values(stats.protocolStats),
      backgroundColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444'
      ]
    }]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Статистика по протоколам
        </h3>
        <div className="h-64">
          <Doughnut data={protocolChartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Время отклика
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Среднее:</span>
            <span className="font-medium">45ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Минимальное:</span>
            <span className="font-medium text-green-500">12ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Максимальное:</span>
            <span className="font-medium text-red-500">156ms</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedStats;