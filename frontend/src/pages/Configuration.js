import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  FloppyDisk,
  Download,
  Upload,
  FileText,
  Code,
  CheckCircle,
  XCircle
} from 'phosphor-react';
import { useTheme } from '../contexts/ThemeContext';

const Configuration = () => {
  const { isDark } = useTheme();
  const [config, setConfig] = useState('');
  const [configFormat, setConfigFormat] = useState('yaml');
  const [isValid, setIsValid] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.data.config);
        setConfigFormat(data.data.format.toLowerCase());
        setLastSaved(new Date(data.data.last_modified));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });
      const data = await response.json();
      if (data.success) {
        setLastSaved(new Date());
        // Показать уведомление об успехе
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateConfig = (value) => {
    try {
      if (configFormat === 'json') {
        JSON.parse(value);
      } else {
        // Для YAML можно добавить валидацию позже
      }
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    }
  };

  const handleConfigChange = (value) => {
    setConfig(value);
    validateConfig(value);
  };

  const exportConfig = () => {
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mihomo-config.${configFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setConfig(content);
        validateConfig(content);
      };
      reader.readAsText(file);
    }
  };

  const loadTemplate = (templateName) => {
    const templates = {
      basic: `port: 7890
socks-port: 7891
allow-lan: false
mode: Rule
log-level: info
external-controller: 127.0.0.1:9090

proxies:
  - name: "example-server"
    type: ss
    server: example.com
    port: 443
    cipher: aes-256-gcm
    password: password

proxy-groups:
  - name: "Proxy"
    type: select
    proxies:
      - "example-server"
      - DIRECT

rules:
  - DOMAIN-SUFFIX,google.com,Proxy
  - GEOIP,CN,DIRECT
  - MATCH,Proxy`,
      advanced: `port: 7890
socks-port: 7891
redir-port: 7892
tproxy-port: 7893
mixed-port: 7894
allow-lan: true
bind-address: "*"
mode: Rule
log-level: info
external-controller: 0.0.0.0:9090
external-ui: dashboard
secret: ""

proxies:
  - name: "us-server"
    type: vmess
    server: us.example.com
    port: 443
    uuid: 12345678-1234-1234-1234-123456789012
    alterId: 0
    cipher: auto
    tls: true

proxy-groups:
  - name: "Proxy"
    type: select
    proxies:
      - "Auto"
      - "us-server"
      - DIRECT
  - name: "Auto"
    type: url-test
    proxies:
      - "us-server"
    url: 'http://www.gstatic.com/generate_204'
    interval: 300

rules:
  - DOMAIN-SUFFIX,google.com,Proxy
  - DOMAIN-KEYWORD,github,Proxy
  - GEOIP,CN,DIRECT
  - MATCH,Proxy`
    };
    
    setConfig(templates[templateName] || templates.basic);
    validateConfig(templates[templateName] || templates.basic);
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full flex flex-col"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Конфигурация mihomo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Редактирование и управление конфигурацией прокси
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={saveConfig}
                disabled={!isValid || isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FloppyDisk size={20} />
                <span>Сохранить</span>
              </button>
              
              <button
                onClick={exportConfig}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                <span>Экспорт</span>
              </button>
              
              <label className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                <Upload size={20} />
                <span>Импорт</span>
                <input
                  type="file"
                  accept=".yaml,.yml,.json"
                  onChange={importConfig}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isValid ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
                <span className={`text-sm font-medium ${
                  isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isValid ? 'Конфигурация валидна' : 'Ошибка в конфигурации'}
                </span>
              </div>
              
              {lastSaved && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Сохранено: {lastSaved.toLocaleTimeString('ru-RU')}
                </span>
              )}
            </div>
          </div>

          {/* Templates */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Шаблоны:
              </span>
              <button
                onClick={() => loadTemplate('basic')}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Базовый
              </button>
              <button
                onClick={() => loadTemplate('advanced')}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Расширенный
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="h-full">
            <Editor
              height="100%"
              language={configFormat}
              theme={isDark ? 'vs-dark' : 'vs-light'}
              value={config}
              onChange={handleConfigChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Configuration;