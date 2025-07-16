import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboard, getAlerts, getSystemStats } from '../services/api';

export const useDashboard = (token) => {
  const [state, setState] = useState({
    data: null,
    alerts: [],
    isLoading: false,
    error: null,
    lastUpdate: null,
    networkStatus: 'online'
  });

  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30000, // 30 segundos
    darkMode: localStorage.getItem('darkMode') === 'true',
    notifications: true
  });

  const refreshTimeoutRef = useRef(null);

  // Função para atualizar dados
  const refreshData = useCallback(async (showLoading = true) => {
    if (!token) return;

    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const [dashboardRes, alertsRes] = await Promise.all([
        getDashboard(token),
        getAlerts(token).catch(() => ({ data: [] })) // Fallback se alertas falharem
      ]);

      setState(prev => ({
        ...prev,
        data: dashboardRes.data,
        alerts: alertsRes.data,
        lastUpdate: new Date().toLocaleString(),
        networkStatus: 'online',
        error: null
      }));

    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
        networkStatus: 'offline'
      }));
    } finally {
      if (showLoading) {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [token]);

  // Auto-refresh
  useEffect(() => {
    if (settings.autoRefresh && token) {
      const interval = setInterval(() => {
        refreshData(false); // Refresh silencioso
      }, settings.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [settings.autoRefresh, settings.refreshInterval, token, refreshData]);

  // Carregamento inicial
  useEffect(() => {
    if (token) {
      refreshData();
    }
  }, [token, refreshData]);

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', settings.darkMode.toString());
  }, [settings.darkMode]);

  // Funções de controle
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const forceRefresh = useCallback(() => {
    refreshData(true);
  }, [refreshData]);

  const updateAlerts = useCallback((newAlerts) => {
    setState(prev => ({ ...prev, alerts: newAlerts }));
  }, []);

  return {
    ...state,
    settings,
    updateSettings,
    forceRefresh,
    updateAlerts
  };
};

// Hook para notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const timeoutsRef = useRef(new Map());

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove após duração especificada
    const timeout = setTimeout(() => {
      removeNotification(id);
    }, duration);

    timeoutsRef.current.set(id, timeout);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Limpa timeout se existir
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    // Limpa todos os timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    
    setNotifications([]);
  }, []);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};

// Hook para performance tracking
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    responseTime: [],
    memoryUsage: [],
    cpuUsage: [],
    lastUpdate: null
  });

  const addMetric = useCallback((type, value) => {
    setMetrics(prev => ({
      ...prev,
      [type]: [...prev[type].slice(-19), { // Mantém últimos 20 valores
        value,
        timestamp: Date.now()
      }],
      lastUpdate: new Date().toISOString()
    }));
  }, []);

  const getAverageMetric = useCallback((type) => {
    const values = metrics[type];
    if (!values.length) return 0;
    
    const sum = values.reduce((acc, item) => acc + item.value, 0);
    return Math.round(sum / values.length);
  }, [metrics]);

  const getMetricTrend = useCallback((type) => {
    const values = metrics[type];
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((acc, item) => acc + item.value, 0) / recent.length;
    const olderAvg = older.reduce((acc, item) => acc + item.value, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 5) return 'increasing';
    if (difference < -5) return 'decreasing';
    return 'stable';
  }, [metrics]);

  return {
    metrics,
    addMetric,
    getAverageMetric,
    getMetricTrend
  };
};

// Hook para temas
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('wayne-theme');
    return saved || 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('wayne-theme', newTheme);
      return newTheme;
    });
  }, []);

  const getThemeColors = useCallback(() => {
    return theme === 'dark' ? {
      primary: '#ff1a1a',
      secondary: '#00eaff',
      accent: '#8f00ff',
      background: '#0f0f0f',
      cardBackground: '#1a1a2e',
      text: '#ffffff',
      border: '#333'
    } : {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: '#f8f9fa',
      cardBackground: '#ffffff',
      text: '#333333',
      border: '#ddd'
    };
  }, [theme]);

  return {
    theme,
    toggleTheme,
    getThemeColors,
    isDark: theme === 'dark'
  };
};

// Hook para keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey;
      const alt = event.altKey;
      const shift = event.shiftKey;

      const shortcutKey = `${ctrl ? 'ctrl+' : ''}${alt ? 'alt+' : ''}${shift ? 'shift+' : ''}${key}`;

      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default {
  useDashboard,
  useNotifications,
  usePerformanceMetrics,
  useTheme,
  useKeyboardShortcuts
};
