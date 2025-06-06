import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Circle, Clock, Globe, Plus, Pencil, Trash, TestTube, X } from 'phosphor-react';

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importName, setImportName] = useState('');
  const [importing, setImporting] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/servers-v2');
      const data = await response.json();
      if (data.success) {
        setServers(Array.isArray(data.data) ? data.data : []);
      } else {
        console.error('Ошибка API:', data.error);
        setServers([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки серверов:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteServer = async (serverId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот сервер?')) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/servers-v2/${serverId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setServers(servers.filter(s => s.id !== serverId));
      } else {
        alert('Ошибка удаления сервера: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Ошибка удаления сервера:', error);
      alert('Ошибка удаления сервера');
    }
  };

  const testServer = async (serverId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/servers-v2/${serverId}/test`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert(`Тест завершен:\nПинг: ${data.data.latency_ms}ms\nСкорость загрузки: ${(data.data.download_speed / 1024).toFixed(0)} KB/s\nСкорость отдачи: ${(data.data.upload_speed / 1024).toFixed(0)} KB/s`);
      } else {
        alert('Ошибка тестирования: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Ошибка тестирования сервера:', error);
      alert('Ошибка тестирования сервера');
    }
  };

  const getProtocolColor = (protocol) => {
    switch (protocol) {
      case 'VMess': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'VLESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Trojan': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Shadowsocks': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'HTTP': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'HTTPS': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SOCKS5': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (active) => {
    return active ? 'text-green-500' : 'text-red-500';
  };

  const getStatusText = (active) => {
    return active ? 'Активен' : 'Неактивен';
  };

  const filteredServers = servers.filter(server => {
    const matchesFilter = filter === 'all' || server.protocol === filter;
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (server.country && server.country.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const protocols = ['all', ...new Set(servers.map(s => s.protocol))];

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              V2Ray Серверы
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление V2Ray серверами (VMess, VLESS, Trojan, Shadowsocks)
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Импорт подписки</span>
            </button>
            <button
              onClick={() => {
                setEditingServer(null);
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить сервер</span>
            </button>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex space-x-2">
            {protocols.map(protocol => (
              <button
                key={protocol}
                onClick={() => setFilter(protocol)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === protocol
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {protocol === 'all' ? 'Все' : protocol}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Поиск по названию, хосту или стране..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServers.map((server, index) => (
          <motion.div
            key={server.id}
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
                    {server.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {server.hostname}:{server.port}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${getStatusColor(server.active)}`}>
                <Circle className="w-3 h-3 fill-current" />
                <span className="text-sm font-medium">
                  {getStatusText(server.active)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getProtocolColor(server.protocol)}`}>
                {server.protocol}
              </span>
              {server.country && (
                <span className="ml-2 inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Globe className="w-4 h-4 mr-1" />
                  {server.country}
                  {server.city && `, ${server.city}`}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {server.latency_ms && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Пинг:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {server.latency_ms}ms
                  </span>
                </div>
              )}
              {server.download_speed && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Скорость:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ↓{(server.download_speed / 1024 / 1024).toFixed(1)}MB/s
                    {server.upload_speed && ` ↑${(server.upload_speed / 1024 / 1024).toFixed(1)}MB/s`}
                  </span>
                </div>
              )}
              {server.last_ping && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Последняя проверка:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(server.last_ping).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <button
                  onClick={() => testServer(server.id)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Тест</span>
                </button>
                <button
                  onClick={() => {
                    setEditingServer(server);
                    setShowModal(true);
                  }}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Изменить</span>
                </button>
                <button
                  onClick={() => deleteServer(server.id)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredServers.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || filter !== 'all' ? 'Серверы не найдены' : 'Нет серверов'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || filter !== 'all' 
              ? 'Попробуйте изменить фильтры или поисковый запрос'
              : 'Добавьте V2Ray серверы для начала работы'
            }
          </p>
          <button
            onClick={() => {
              setEditingServer(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Добавить сервер
          </button>
        </div>
      )}

      {/* Модальное окно для создания/редактирования сервера */}
      <ServerModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingServer(null);
        }}
        server={editingServer}
        onSave={() => {
          fetchServers();
          setShowModal(false);
          setEditingServer(null);
        }}
      />
    </div>
  );
};

// Компонент модального окна для создания/редактирования сервера
const ServerModal = ({ isOpen, onClose, server, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    port: 443,
    protocol: 'VMess',
    active: true,
    country: '',
    city: '',
    config: {}
  });

  const [configData, setConfigData] = useState({
    // VMess
    uuid: '',
    alter_id: 0,
    security: 'auto',
    network: 'tcp',
    tls: false,
    sni: '',
    alpn: '',
    // VLESS
    flow: '',
    encryption: 'none',
    fp: '',
    pbk: '',
    sid: '',
    spx: '',
    // Trojan
    password: '',
    // Shadowsocks
    method: 'aes-256-gcm'
  });

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name || '',
        hostname: server.hostname || '',
        port: server.port || 443,
        protocol: server.protocol || 'VMess',
        active: server.active !== undefined ? server.active : true,
        country: server.country || '',
        city: server.city || ''
      });
      
      // Извлекаем конфигурацию в зависимости от протокола
      if (server.config) {
        if (server.protocol === 'VMess' && server.config.Vmess) {
          setConfigData({
            ...configData,
            uuid: server.config.Vmess.uuid || '',
            alter_id: server.config.Vmess.alter_id || 0,
            security: server.config.Vmess.security || 'auto',
            network: server.config.Vmess.network || 'tcp',
            tls: server.config.Vmess.tls || false,
            sni: server.config.Vmess.sni || '',
            alpn: server.config.Vmess.alpn || ''
          });
        } else if (server.protocol === 'VLESS' && server.config.Vless) {
          setConfigData({
            ...configData,
            uuid: server.config.Vless.uuid || '',
            flow: server.config.Vless.flow || '',
            encryption: server.config.Vless.encryption || 'none',
            network: server.config.Vless.network || 'tcp',
            security: server.config.Vless.security || 'tls',
            sni: server.config.Vless.sni || '',
            alpn: server.config.Vless.alpn || '',
            fp: server.config.Vless.fp || '',
            pbk: server.config.Vless.pbk || '',
            sid: server.config.Vless.sid || '',
            spx: server.config.Vless.spx || ''
          });
        } else if (server.protocol === 'Trojan' && server.config.Trojan) {
          setConfigData({
            ...configData,
            password: server.config.Trojan.password || ''
          });
        } else if (server.protocol === 'Shadowsocks' && server.config.Shadowsocks) {
          setConfigData({
            ...configData,
            method: server.config.Shadowsocks.method || 'aes-256-gcm',
            password: server.config.Shadowsocks.password || ''
          });
        }
      }
    } else {
      // Сброс формы для нового сервера
      setFormData({
        name: '',
        hostname: '',
        port: 443,
        protocol: 'VMess',
        active: true,
        country: '',
        city: ''
      });
      setConfigData({
        uuid: '',
        alter_id: 0,
        security: 'auto',
        network: 'tcp',
        tls: false,
        sni: '',
        alpn: '',
        flow: '',
        encryption: 'none',
        fp: '',
        pbk: '',
        sid: '',
        spx: '',
        password: '',
        method: 'aes-256-gcm'
      });
    }
  }, [server]);

  const buildConfig = () => {
    switch (formData.protocol) {
      case 'VMess':
        return {
          Vmess: {
            uuid: configData.uuid,
            alter_id: parseInt(configData.alter_id) || 0,
            security: configData.security,
            network: configData.network,
            tls: configData.tls,
            sni: configData.sni || null,
            alpn: configData.alpn || null
          }
        };
      case 'VLESS':
        return {
          Vless: {
            uuid: configData.uuid,
            flow: configData.flow || null,
            encryption: configData.encryption,
            network: configData.network,
            security: configData.security,
            sni: configData.sni || null,
            alpn: configData.alpn || null,
            fp: configData.fp || null,
            pbk: configData.pbk || null,
            sid: configData.sid || null,
            spx: configData.spx || null
          }
        };
      case 'Trojan':
        return {
          Trojan: {
            password: configData.password
          }
        };
      case 'Shadowsocks':
        return {
          Shadowsocks: {
            method: configData.method,
            password: configData.password
          }
        };
      case 'HTTP':
        return 'Http';
      case 'HTTPS':
        return 'Https';
      case 'SOCKS5':
        return 'Socks5';
      default:
        return 'Http';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const serverData = {
      ...formData,
      config: buildConfig()
    };

    try {
      const url = server 
        ? `http://localhost:8080/api/servers-v2/${server.id}`
        : 'http://localhost:8080/api/servers-v2';
      
      const method = server ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serverData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSave();
      } else {
        alert('Ошибка сохранения: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Ошибка сохранения сервера:', error);
      alert('Ошибка сохранения сервера');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={() => setShowImportModal(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Импорт подписки
            </h2>
            <button
              onClick={() => setShowImportModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL подписки *
              </label>
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/subscription"
                disabled={importing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Название подписки (опционально)
              </label>
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Моя подписка"
                disabled={importing}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={importing}
            >
              Отмена
            </button>
            <button
              onClick={importSubscription}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={importing || !importUrl.trim()}
            >
              {importing ? 'Импортирую...' : 'Импортировать'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const importSubscription = async () => {
  if (!importUrl.trim()) {
    alert('Пожалуйста, введите URL подписки');
    return;
  }

  setImporting(true);
  try {
    const response = await fetch('http://localhost:8080/api/subscriptions/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: importUrl.trim(),
        name: importName.trim() || null
      })
    });

    const data = await response.json();
    if (data.success) {
      alert(`Подписка успешно импортирована! Добавлено серверов: ${data.data.servers_count}`);
      setShowImportModal(false);
      setImportUrl('');
      setImportName('');
      fetchServers(); // Обновляем список серверов
    } else {
      alert('Ошибка импорта: ' + (data.error?.message || 'Неизвестная ошибка'));
    }
  } catch (error) {
    console.error('Ошибка импорта подписки:', error);
    alert('Ошибка импорта подписки: ' + error.message);
  } finally {
    setImporting(false);
  }
};

export default Servers;