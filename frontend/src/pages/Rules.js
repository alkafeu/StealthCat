import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash, PencilSimple, Shield, Globe, ToggleLeft, ToggleRight } from 'phosphor-react';

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newRule, setNewRule] = useState({
    name: '',
    type: 'domain',
    pattern: '',
    action: 'proxy',
    enabled: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data.data || []);
      } else {
        // Демо данные для разработки
        setRules([
          {
            id: 1,
            name: 'Блокировка рекламы',
            type: 'domain',
            pattern: '*.ads.google.com',
            action: 'block',
            enabled: true
          },
          {
            id: 2,
            name: 'Прямое соединение для локальных сайтов',
            type: 'domain',
            pattern: '*.local',
            action: 'direct',
            enabled: true
          },
          {
            id: 3,
            name: 'Проксирование социальных сетей',
            type: 'keyword',
            pattern: 'facebook',
            action: 'proxy',
            enabled: false
          }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки правил:', error);
      // Демо данные при ошибке
      setRules([
        {
          id: 1,
          name: 'Блокировка рекламы',
          type: 'domain',
          pattern: '*.ads.google.com',
          action: 'block',
          enabled: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async () => {
    try {
      const url = editingRule 
        ? `http://localhost:8080/api/rules/${editingRule.id}`
        : 'http://localhost:8080/api/rules';
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      
      if (response.ok) {
        fetchRules();
        setShowModal(false);
        setEditingRule(null);
        resetForm();
      }
    } catch (error) {
      console.error('Ошибка сохранения правила:', error);
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить это правило?')) {
      return;
    }
    
    try {
      await fetch(`http://localhost:8080/api/rules/${id}`, { method: 'DELETE' });
      setRules(rules.filter(rule => rule.id !== id));
    } catch (error) {
      console.error('Ошибка удаления правила:', error);
    }
  };

  const toggleRule = async (id) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;

    try {
      await fetch(`http://localhost:8080/api/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, enabled: !rule.enabled })
      });
      
      setRules(rules.map(r => 
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ));
    } catch (error) {
      console.error('Ошибка переключения правила:', error);
    }
  };

  const resetForm = () => {
    setNewRule({ name: '', type: 'domain', pattern: '', action: 'proxy', enabled: true });
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setNewRule({ ...rule });
    setShowModal(true);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'proxy': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'direct': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'block': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case 'proxy': return 'Проксировать';
      case 'direct': return 'Прямое соединение';
      case 'block': return 'Блокировать';
      default: return action;
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
            <Shield className="w-6 h-6 mr-2" />
            Правила фильтрации
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Управление правилами маршрутизации трафика
          </p>
        </div>
        // Заменить все bg-blue-500 на bg-accent
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent hover:bg-accent text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить правило</span>
        </button>
      </div>

      <div className="grid gap-4">
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Нет правил
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Создайте первое правило для управления трафиком
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Создать правило
            </button>
          </div>
        ) : (
          rules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`transition-colors ${
                      rule.enabled ? 'text-green-500' : 'text-gray-400'
                    }`}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-lg text-gray-900 dark:text-white">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getActionColor(rule.action)
                      }`}>
                        {getActionText(rule.action)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="font-medium">{rule.type}:</span> {rule.pattern}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Редактировать"
                  >
                    <PencilSimple className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Удалить"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Модальное окно для создания/редактирования правил */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingRule ? 'Редактировать правило' : 'Новое правило'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Название</label>
                <input
                  type="text"
                  placeholder="Название правила"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Тип</label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="domain">Домен</option>
                  <option value="ip">IP адрес</option>
                  <option value="keyword">Ключевое слово</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Шаблон</label>
                <input
                  type="text"
                  placeholder="Например: *.google.com или 192.168.1.*"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Действие</label>
                <select
                  value={newRule.action}
                  onChange={(e) => setNewRule({...newRule, action: e.target.value})}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="proxy">Проксировать</option>
                  <option value="direct">Прямое соединение</option>
                  <option value="block">Блокировать</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newRule.enabled}
                  onChange={(e) => setNewRule({...newRule, enabled: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-900 dark:text-white">
                  Включить правило
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={saveRule}
                disabled={!newRule.name || !newRule.pattern}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {editingRule ? 'Обновить' : 'Создать'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Rules;