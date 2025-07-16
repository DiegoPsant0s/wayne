import React, { useEffect, useState } from "react";
import { getDashboard, getAlerts } from "../services/api";

const Dashboard = ({ user, onAuthError }) => {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.token) {
      setIsLoading(true);
      getDashboard(user.token)
        .then(res => {
          setData(res.data);
        })
        .catch((err) => {
          if (err.status === 401 && onAuthError) {
            onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
          }
          setData({ 
            user: user.username,
            role: user.role,
            resources: [],
            stats: { total: 0, active: 0, inactive: 0 }
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, onAuthError]);

  useEffect(() => {
    if (user?.token) {
      getAlerts(user.token)
        .then(res => {
          setAlerts(res.data);
          console.log('ALERTAS RECEBIDOS:', res.data);
        })
        .catch((err) => {
          if (err.status === 401 && onAuthError) {
            onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
          }
          setAlerts([]);
        });
    }
  }, [user, onAuthError]);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div>Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bem-vindo ao Wayne Secure System, <span style={{color:'#00fff7', textShadow:'0 0 8px #00fff7'}}>{user?.username}</span>!</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Informações do Usuário</h3>
          <p><strong>Usuário:</strong> <span style={{color:'#00fff7'}}>{user?.username}</span></p>
          <p><strong>Função:</strong> <span style={{color:'#ff0055'}}>{user?.role}</span></p>
          <p><strong>Status:</strong> <span style={{color:'#ffd700'}}>Ativo</span></p>
        </div>

        <div className="card">
          <h3>Recursos do Sistema</h3>
          <p><strong>Total:</strong> <span style={{color:'#00fff7'}}>{data?.stats?.total || 0}</span></p>
          <p><strong>Ativos:</strong> <span style={{color:'#00fff7'}}>{data?.stats?.active || 0}</span></p>
          <p><strong>Inativos:</strong> <span style={{color:'#ff0055'}}>{data?.stats?.inactive || 0}</span></p>
        </div>

        <div className="card">
          <h3>Alertas Recentes</h3>
          {alerts.length > 0 ? (
            <div className="alerts-list">
              {alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="alert-item">
                  <span className={`alert-level ${alert.level}`}>{alert.level}</span>
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhum alerta no momento</p>
          )}
        </div>

        <div className="card">
          <h3>Status do Sistema</h3>
          <div className="system-status">
            <div className="status-item">
              <span className="status-indicator online"></span>
              <span style={{color:'#00fff7'}}>Sistema Online</span>
            </div>
            <div className="status-item">
              <span className="status-indicator secure"></span>
              <span style={{color:'#ff0055'}}>Segurança Ativa</span>
            </div>
            <div className="status-item">
              <span className="status-indicator monitored"></span>
              <span style={{color:'#ffd700'}}>Monitoramento Ativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
