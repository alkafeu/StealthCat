import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gear, Moon, Sun, Palette, Globe, Shield, Bell } from 'phosphor-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const Settings = () => {
  const { theme, toggleTheme, accentColor, changeAccentColor } = useTheme();
  const { language, changeLanguage, t, availableLanguages } = useLanguage();
  const [settings, setSettings] = useState({
    autoStart: true,
    minimizeToTray: true,
    notifications: true,
    autoUpdate: true,
    proxyPort: 8080,
    apiPort: 8081
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const accentColors = [
    { name: t('blue'), value: 'blue', class: 'bg-blue-500' },
    { name: t('purple'), value: 'purple', class: 'bg-purple-500' },
    { name: t('green'), value: 'green', class: 'bg-green-500' },
    { name: t('red'), value: 'red', class: 'bg-red-500' },
    { name: t('yellow'), value: 'yellow', class: 'bg-yellow-500' },
    { name: t('pink'), value: 'pink', class: 'bg-pink-500' },
    { name: t('indigo'), value: 'indigo', class: 'bg-indigo-500' },
    { name: t('teal'), value: 'teal', class: 'bg-teal-500' },
    { name: t('orange'), value: 'orange', class: 'bg-orange-500' }
  ];

  const SettingSection = ({ title, children, icon: Icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );

  const ToggleSetting = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
          value ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Настройки
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Конфигурация приложения и персонализация
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Внешний вид */}
        <SettingSection title={t('appearance')} icon={Palette}>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              {t('theme')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t('themeDescription')}
            </p>
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="text-sm">{t('dark')}</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="text-sm">{t('light')}</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-3 block">
              {t('accentColor')}
            </label>
            <div className="flex space-x-3">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => changeAccentColor(color.value)}
                  className={`w-8 h-8 rounded-full ${color.class} ${
                    accentColor === color.value
                      ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600'
                      : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </SettingSection>

        {/* Общие настройки */}
        <SettingSection title={t('general')} icon={Gear}>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              {t('language')}
            </label>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <ToggleSetting
            label={t('autoStart')}
            description={t('autoStartDescription')}
            value={settings.autoStart}
            onChange={(value) => handleSettingChange('autoStart', value)}
          />

          <ToggleSetting
            label={t('minimizeToTray')}
            description={t('minimizeToTrayDescription')}
            value={settings.minimizeToTray}
            onChange={(value) => handleSettingChange('minimizeToTray', value)}
          />
        </SettingSection>

        {/* Уведомления */}
        <SettingSection title={t('notifications')} icon={Bell}>
          <ToggleSetting
            label={t('notifications')}
            description={t('notificationsDescription')}
            value={settings.notifications}
            onChange={(value) => handleSettingChange('notifications', value)}
          />

          <ToggleSetting
            label={t('autoUpdate')}
            description={t('autoUpdateDescription')}
            value={settings.autoUpdate}
            onChange={(value) => handleSettingChange('autoUpdate', value)}
          />
        </SettingSection>

        {/* Сетевые настройки */}
        <SettingSection title={t('networkSettings')} icon={Shield}>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              {t('proxyPort')}
            </label>
            <input
              type="number"
              value={settings.proxyPort}
              onChange={(e) => handleSettingChange('proxyPort', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              {t('apiPort')}
            </label>
            <input
              type="number"
              value={settings.apiPort}
              onChange={(e) => handleSettingChange('apiPort', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </SettingSection>

        {/* Кнопки действий */}
        <div className="flex space-x-4">
          <button className="flex-1 bg-accent hover:bg-accent text-white px-4 py-2 rounded-md transition-colors">
            {t('saveSettings')}
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('reset')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;