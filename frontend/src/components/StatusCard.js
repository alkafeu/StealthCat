import React from 'react';
import { motion } from 'framer-motion';

const StatusCard = ({ title, value, icon: Icon, color, onClick }) => {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        colorClasses[color] || colorClasses.blue
      } ${onClick ? 'hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon size={24} className="opacity-80" />
        {onClick && (
          <div className="w-2 h-2 bg-current rounded-full opacity-60" />
        )}
      </div>
      <h3 className="text-sm font-medium opacity-80 mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </motion.div>
  );
};

export default StatusCard;