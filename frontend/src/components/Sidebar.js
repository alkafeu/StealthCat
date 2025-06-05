import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  House,
  Gear,
  Database,
  FileText,
  List,
  CaretLeft,
  CaretRight,
  Activity
} from 'phosphor-react';
import { Shield } from 'phosphor-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = ({ currentPage, onPageChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();
  const { accentColor } = useTheme();

  const menuItems = [
    { id: 'dashboard', name: t('dashboard'), path: '/dashboard', icon: House },
    { id: 'rules', name: t('rules'), path: '/rules', icon: Shield },
    { id: 'configuration', name: t('configuration'), path: '/configuration', icon: Gear },
    { id: 'servers', name: t('servers'), path: '/servers', icon: Database },
    { id: 'logs', name: t('logs'), path: '/logs', icon: FileText },
    { id: 'settings', name: t('settings'), path: '/settings', icon: Gear }
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  StealthCat 🐱
                </h1>
              </div>
            </motion.div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? (
              <CaretRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <CaretLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'sidebar-item-active'
                      : 'text-gray-600 dark:text-gray-400 sidebar-item-hover'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.div>
  );
};

export default Sidebar;