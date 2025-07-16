// Utilitários para Analytics e Monitoramento do Sistema Wayne

class WayneAnalytics {
  constructor() {
    this.events = [];
    this.sessionStart = Date.now();
    this.pageViews = new Map();
    this.userInteractions = new Map();
    this.performanceMetrics = new Map();
    this.errorLog = [];
  }

  // Rastreamento de eventos
  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionTime: Date.now() - this.sessionStart,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.events.push(event);
    
    // Mantém apenas os últimos 1000 eventos para performance
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    console.log('📊 Wayne Analytics:', event);
    return event;
  }

  // Rastreamento de page views
  trackPageView(pageName) {
    const currentCount = this.pageViews.get(pageName) || 0;
    this.pageViews.set(pageName, currentCount + 1);
    
    this.trackEvent('page_view', {
      page: pageName,
      totalViews: currentCount + 1
    });
  }

  // Rastreamento de interações do usuário
  trackUserInteraction(elementType, action, details = {}) {
    const key = `${elementType}_${action}`;
    const currentCount = this.userInteractions.get(key) || 0;
    this.userInteractions.set(key, currentCount + 1);

    this.trackEvent('user_interaction', {
      elementType,
      action,
      count: currentCount + 1,
      details
    });
  }

  // Monitoramento de performance
  trackPerformance(metricName, value, unit = 'ms') {
    const metric = {
      value,
      unit,
      timestamp: Date.now()
    };

    if (!this.performanceMetrics.has(metricName)) {
      this.performanceMetrics.set(metricName, []);
    }

    const metrics = this.performanceMetrics.get(metricName);
    metrics.push(metric);

    // Mantém apenas os últimos 100 valores
    if (metrics.length > 100) {
      metrics.shift();
    }

    this.trackEvent('performance_metric', {
      metric: metricName,
      value,
      unit,
      average: this.getAverageMetric(metricName)
    });
  }

  // Rastreamento de erros
  trackError(error, context = {}) {
    const errorEvent = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.errorLog.push(errorEvent);
    
    // Mantém apenas os últimos 50 erros
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }

    this.trackEvent('error', {
      errorMessage: error.message,
      errorType: error.name,
      context
    });

    console.error('🚨 Wayne Error Tracked:', errorEvent);
  }

  // Análise de dados
  getAverageMetric(metricName) {
    const metrics = this.performanceMetrics.get(metricName) || [];
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return Math.round(sum / metrics.length);
  }

  getTopInteractions(limit = 10) {
    return Array.from(this.userInteractions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ interaction: key, count }));
  }

  getSessionSummary() {
    const sessionDuration = Date.now() - this.sessionStart;
    
    return {
      sessionDuration: Math.round(sessionDuration / 1000), // em segundos
      totalEvents: this.events.length,
      totalPageViews: Array.from(this.pageViews.values()).reduce((a, b) => a + b, 0),
      totalInteractions: Array.from(this.userInteractions.values()).reduce((a, b) => a + b, 0),
      totalErrors: this.errorLog.length,
      topPages: Array.from(this.pageViews.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topInteractions: this.getTopInteractions(5)
    };
  }

  // Relatório de segurança
  getSecurityReport() {
    const securityEvents = this.events.filter(event => 
      event.name.includes('login') || 
      event.name.includes('logout') || 
      event.name.includes('access_denied') ||
      event.name.includes('permission')
    );

    return {
      totalSecurityEvents: securityEvents.length,
      loginAttempts: securityEvents.filter(e => e.name.includes('login')).length,
      accessDeniedEvents: securityEvents.filter(e => e.name.includes('access_denied')).length,
      recentSecurityEvents: securityEvents.slice(-10)
    };
  }

  // Exportar dados
  exportData() {
    return {
      session: this.getSessionSummary(),
      events: this.events,
      pageViews: Object.fromEntries(this.pageViews),
      userInteractions: Object.fromEntries(this.userInteractions),
      performanceMetrics: Object.fromEntries(
        Array.from(this.performanceMetrics.entries()).map(([key, values]) => [
          key, 
          {
            values,
            average: this.getAverageMetric(key),
            count: values.length
          }
        ])
      ),
      errors: this.errorLog,
      security: this.getSecurityReport()
    };
  }

  // Limpar dados
  clearData() {
    this.events = [];
    this.pageViews.clear();
    this.userInteractions.clear();
    this.performanceMetrics.clear();
    this.errorLog = [];
    this.sessionStart = Date.now();
  }
}

// Classe para monitoramento de sistema
class SystemMonitor {
  constructor() {
    this.startTime = performance.now();
    this.metrics = {
      memory: [],
      timing: [],
      navigation: [],
      resources: []
    };
    
    this.startMonitoring();
  }

  startMonitoring() {
    // Monitora performance de navegação
    if (performance.navigation) {
      this.metrics.navigation.push({
        type: performance.navigation.type,
        redirectCount: performance.navigation.redirectCount,
        timestamp: Date.now()
      });
    }

    // Monitora recursos carregados
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      this.metrics.resources = resources.map(resource => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize || 0,
        type: resource.initiatorType
      }));
    }

    // Monitora memoria (se disponível)
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memory.push({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        });

        // Mantém apenas os últimos 100 registros
        if (this.metrics.memory.length > 100) {
          this.metrics.memory.shift();
        }
      }, 10000); // A cada 10 segundos
    }
  }

  getCurrentMetrics() {
    const current = {
      uptime: Math.round((performance.now() - this.startTime) / 1000),
      memory: this.getLatestMemoryUsage(),
      resourceCount: this.metrics.resources.length,
      averageResourceLoadTime: this.getAverageResourceLoadTime()
    };

    return current;
  }

  getLatestMemoryUsage() {
    if (this.metrics.memory.length === 0) return null;
    
    const latest = this.metrics.memory[this.metrics.memory.length - 1];
    return {
      used: Math.round(latest.used / 1024 / 1024), // MB
      total: Math.round(latest.total / 1024 / 1024), // MB
      percentage: Math.round((latest.used / latest.total) * 100)
    };
  }

  getAverageResourceLoadTime() {
    if (this.metrics.resources.length === 0) return 0;
    
    const totalTime = this.metrics.resources.reduce((sum, resource) => sum + resource.duration, 0);
    return Math.round(totalTime / this.metrics.resources.length);
  }

  getResourcesByType() {
    const types = {};
    this.metrics.resources.forEach(resource => {
      if (!types[resource.type]) {
        types[resource.type] = [];
      }
      types[resource.type].push(resource);
    });

    return Object.entries(types).map(([type, resources]) => ({
      type,
      count: resources.length,
      totalSize: resources.reduce((sum, r) => sum + r.size, 0),
      averageLoadTime: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
    }));
  }
}

// Classe para detecção de ameaças
class ThreatDetector {
  constructor() {
    this.suspiciousActivities = [];
    this.rateLimiters = new Map();
    this.patterns = {
      bruteForce: /password|login|auth/i,
      sqlInjection: /('|\\')|(;|\\;)|(select|union|insert|delete|update|drop|create|alter|exec|execute)/i,
      xss: /(<script|javascript:|onerror=|onload=|onclick=)/i
    };
  }

  checkSuspiciousActivity(activity) {
    const suspicion = {
      timestamp: Date.now(),
      activity,
      riskLevel: 'low',
      reason: []
    };

    // Detecta tentativas de força bruta
    if (this.patterns.bruteForce.test(activity.type)) {
      const key = `${activity.ip || 'unknown'}_${activity.type}`;
      const attempts = this.rateLimiters.get(key) || [];
      attempts.push(Date.now());
      
      // Remove tentativas antigas (mais de 1 hora)
      const recentAttempts = attempts.filter(time => Date.now() - time < 3600000);
      this.rateLimiters.set(key, recentAttempts);

      if (recentAttempts.length > 10) {
        suspicion.riskLevel = 'high';
        suspicion.reason.push('Multiple authentication attempts');
      }
    }

    // Detecta padrões de injeção SQL
    if (this.patterns.sqlInjection.test(activity.data)) {
      suspicion.riskLevel = 'high';
      suspicion.reason.push('Potential SQL injection attempt');
    }

    // Detecta XSS
    if (this.patterns.xss.test(activity.data)) {
      suspicion.riskLevel = 'high';
      suspicion.reason.push('Potential XSS attempt');
    }

    if (suspicion.reason.length > 0) {
      this.suspiciousActivities.push(suspicion);
      
      // Mantém apenas as últimas 1000 atividades suspeitas
      if (this.suspiciousActivities.length > 1000) {
        this.suspiciousActivities.shift();
      }

      return suspicion;
    }

    return null;
  }

  getThreats(severity = 'all') {
    if (severity === 'all') {
      return this.suspiciousActivities;
    }
    
    return this.suspiciousActivities.filter(activity => activity.riskLevel === severity);
  }

  getThreatSummary() {
    const threats = this.suspiciousActivities;
    const last24h = threats.filter(t => Date.now() - t.timestamp < 86400000);

    return {
      total: threats.length,
      last24h: last24h.length,
      byRiskLevel: {
        high: threats.filter(t => t.riskLevel === 'high').length,
        medium: threats.filter(t => t.riskLevel === 'medium').length,
        low: threats.filter(t => t.riskLevel === 'low').length
      },
      topThreats: this.getTopThreats(5)
    };
  }

  getTopThreats(limit = 10) {
    const threatTypes = {};
    
    this.suspiciousActivities.forEach(threat => {
      threat.reason.forEach(reason => {
        threatTypes[reason] = (threatTypes[reason] || 0) + 1;
      });
    });

    return Object.entries(threatTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([type, count]) => ({ type, count }));
  }
}

// Instâncias globais
export const wayneAnalytics = new WayneAnalytics();
export const systemMonitor = new SystemMonitor();
export const threatDetector = new ThreatDetector();

// Função para inicializar monitoramento automático
export const initializeMonitoring = () => {
  // Rastreia erros globais
  window.addEventListener('error', (event) => {
    wayneAnalytics.trackError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Rastreia promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    wayneAnalytics.trackError(new Error(event.reason), {
      type: 'unhandled_promise_rejection'
    });
  });

  // Rastreia mudanças de página
  let currentPage = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPage) {
      wayneAnalytics.trackPageView(window.location.pathname);
      currentPage = window.location.pathname;
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.log('🛡️ Wayne Security Monitoring initialized');
};

export default {
  wayneAnalytics,
  systemMonitor,
  threatDetector,
  initializeMonitoring
};
