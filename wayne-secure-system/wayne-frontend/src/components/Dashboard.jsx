import React, { useEffect, useState, useCallback, useRef } from "react";
import { getDashboard, getAlerts, getDashboardSummary, deleteAlert, editAlert } from "../services/api";
import AlertsList from "./AlertsList";

const Dashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [current, setCurrent] = useState("overview");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lastLogin, setLastLogin] = useState(() => new Date().toLocaleString());

  const [darkMode, setDarkMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [alertFilter, setAlertFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState("online");
  const refreshInterval = useRef(null);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Estado para usuários cadastrados
  const [users, setUsers] = useState([]);

  // Sistema de notificações toast
  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now();
    const notification = { id, message, type, timestamp: new Date() };
    setNotifications(prev => [...prev, notification]);
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Função de atualização de dados melhorada
  const refreshData = useCallback(async () => {
    if (!user?.token) return;
    
    setIsLoading(true);
    
    try {
      const [dashboardRes, alertsRes] = await Promise.all([
        getDashboard(token),
        current === "alerts" ? getAlerts(token) : Promise.resolve({ data: alerts })
      ]);
      
      setData(dashboardRes.data);
      if (current === "alerts") {
        setAlerts(alertsRes.data);
      }
      setLastUpdate(new Date().toLocaleString());
      setNetworkStatus("online");
      
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      setNetworkStatus("offline");
      addNotification("Erro ao conectar com o servidor", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, current, alerts, addNotification]);

  // Auto-refresh configurável
  useEffect(() => {
    if (autoRefresh && token) {
      refreshInterval.current = setInterval(refreshData, 30000); // 30 segundos
      return () => clearInterval(refreshInterval.current);
    }
  }, [autoRefresh, token, refreshData]);

  useEffect(() => {
    if (token) {
      getDashboard(token)
        .then(res => {
          setData(res.data);
          setLastUpdate(new Date().toLocaleString());
        })
        .catch(() => setData({ user: "Erro", role: "-", resources: [] }));
    }
  }, [token]);

  useEffect(() => {
    if (current === "alerts" && token) {
      getAlerts(token)
        .then(res => setAlerts(res.data))
        .catch(() => setAlerts([]));
    }
  }, [current, token]);

  // Buscar usuários cadastrados se admin
  useEffect(() => {
    if (data && data.role && data.role.toUpperCase() === "ADMIN") {
      getUsers(token)
        .then(res => setUsers(res.data))
        .catch(() => setUsers([]));
    }
  }, [data, token]);

  // Filtros avançados para alertas
  const filteredAlerts = alerts.filter(alert => {
    if (alertFilter === "all") return true;
    if (alertFilter === "high") return alert.level === "ALTO";
    if (alertFilter === "medium") return alert.level === "MÉDIO";
    if (alertFilter === "low") return alert.level === "BAIXO";
    return true;
  });

  // Função de logout real melhorada
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout(token);
      addNotification("Logout realizado com sucesso!", "success");
      
      // Limpa intervalos
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      
      // Delay para mostrar notificação
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Erro no logout:", error);
      addNotification("Erro no logout, mas sessão será encerrada", "warning");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // Funções para configurações
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleAutoRefresh = () => setAutoRefresh(!autoRefresh);

  // Funções para abrir/fechar modais
  const handleOpenChangePassword = () => setShowChangePassword(true);
  const handleOpenCreateProfile = () => setShowCreateProfile(true);
  const handleOpenEditProfile = () => setShowEditProfile(true);
  const handleOpenDeleteProfile = () => setShowDeleteProfile(true);

  const handleCloseModals = () => {
    setShowChangePassword(false);
    setShowCreateProfile(false);
    setShowEditProfile(false);
    setShowDeleteProfile(false);
    setShowSettings(false);
  };

  // Funções para editar/remover alertas
  const handleDeleteAlert = (id) => {
    if (window.confirm("Deseja remover este alerta?")) {
      deleteAlert(id, token).then(() => {
        setAlerts(alerts => alerts.filter(a => a.id !== id));
      });
    }
  };

  const handleEditAlert = (id, oldMessage) => {
    const newMsg = prompt("Nova mensagem do alerta:", oldMessage);
    if (newMsg && newMsg !== oldMessage) {
      editAlert(id, { message: newMsg }, token).then(() => {
        setAlerts(alerts => alerts.map(a => a.id === id ? { ...a, message: newMsg } : a));
      });
    }
  };

  if (!token) {
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: 100 }}>
        Sem acesso. Faça login.
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: 100 }}>
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)",
      color: "#fff",
      fontFamily: "Orbitron, 'Segoe UI', Arial, sans-serif",
      transition: "all 0.3s ease"
    }}>
      {/* Sistema de Notificações */}
      <NotificationSystem notifications={notifications} />
      
      {/* Indicador de Status de Rede */}
      <NetworkStatus status={networkStatus} />
      
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
      
      <Navbar 
        current={current} 
        setCurrent={setCurrent} 
        onLogout={handleLogout}
      />
      
      <div style={{ padding: 40 }}>
        <div style={{
          background: "rgba(26,26,46,0.98)",
          borderRadius: 18,
          border: "2.5px solid #00eaff",
          boxShadow: "0 0 32px #00eaff55",
          padding: 36,
          marginBottom: 32,
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          <HeaderSection 
            user={data.user} 
            role={data.role} 
            lastUpdate={lastUpdate} 
            totalAlerts={alerts.length}
            darkMode={darkMode}
          />
        </div>
        
        {current === "overview" && (
          <Overview data={data} token={token} darkMode={darkMode} />
        )}
        {current === "resources" && (
          <ResourceManager token={token} userRole={data.role} />
        )}
        {current === "alerts" && (
          <Section title="Alertas" darkMode={darkMode}>
            {/* Filtros de Alerta */}
            <AlertFilters 
              currentFilter={alertFilter}
              onFilterChange={setAlertFilter}
              alertCounts={{
                all: alerts.length,
                high: alerts.filter(a => a.level === "ALTO").length,
                medium: alerts.filter(a => a.level === "MÉDIO").length,
                low: alerts.filter(a => a.level === "BAIXO").length
              }}
              darkMode={darkMode}
            />
            <AlertsList 
              alerts={filteredAlerts}
              onDelete={handleDeleteAlert}
              onEdit={handleEditAlert}
              darkMode={darkMode}
            />
          </Section>
        )}
        {current === "profile" && (
          <Section title="Perfil" darkMode={darkMode}>
            <p>Usuário: {data.user}</p>
            <p>Role: {data.role}</p>
            <p>Último acesso: {lastLogin}</p>
            <button
              style={{ marginTop: 16, marginBottom: 24 }}
              onClick={handleOpenChangePassword}
            >
              Alterar senha
            </button>
            {data.role && data.role.toUpperCase() === "ADMIN" && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ color: "#00eaff" }}>Gerenciar Perfis</h3>
                <button style={{ marginRight: 12 }} onClick={handleOpenCreateProfile}>
                  Criar perfil
                </button>
                <button style={{ marginRight: 12 }} onClick={handleOpenEditProfile}>
                  Editar perfil
                </button>
                <button style={{ marginRight: 12 }} onClick={handleOpenDeleteProfile}>
                  Excluir perfil
                </button>
              </div>
            )}

            {/* Modais com formulários */}
            {showChangePassword && (
              <Modal onClose={handleCloseModals} title="Alterar senha">
                <ChangePasswordForm onSubmit={(oldPass, newPass) => {
                  alert(`Senha alterada de "${oldPass}" para "${newPass}" (simulação)`);
                  handleCloseModals();
                }} />
              </Modal>
            )}
            {showCreateProfile && (
              <Modal onClose={handleCloseModals} title="Criar perfil">
                <CreateProfileForm onSubmit={(username, role, password) => {
                  alert(`Perfil criado: ${username} (${role}) - senha: ${password} (simulação)`);
                  handleCloseModals();
                }} />
              </Modal>
            )}
            {showEditProfile && (
              <Modal onClose={handleCloseModals} title="Editar perfil">
                <EditProfileForm users={users} onSubmit={(username, role) => {
                  alert(`Perfil editado: ${username} novo papel: ${role} (simulação)`);
                  handleCloseModals();
                }} />
              </Modal>
            )}
            {showDeleteProfile && (
              <Modal onClose={handleCloseModals} title="Excluir perfil">
                <DeleteProfileForm users={users} onSubmit={username => {
                  alert(`Perfil excluído: ${username} (simulação)`);
                  handleCloseModals();
                }} />
              </Modal>
            )}
          </Section>
        )}
        
        {/* Configurações */}
        {showSettings && (
          <Modal onClose={handleCloseModals} title="Configurações">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label>
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={toggleDarkMode}
                />
                Modo Escuro
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={toggleAutoRefresh}
                />
                Atualização Automática
              </label>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

function HeaderSection({ user, role, lastUpdate, totalAlerts, darkMode }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 32,
      borderBottom: "1.5px solid #222",
      paddingBottom: 20
    }}>
      <div>
        <h2 style={{ margin: 0, color: "#00eaff" }}>
          Bem-vindo(a), <span style={{ color: "#ff1a1a" }}>{user}</span>!
        </h2>
        <span style={{ fontSize: 16, color: "#8f00ff" }}>
          Nível de acesso: <b>{role}</b>
        </span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div>
          <span style={{ color: "#ffbb28" }}>Alertas: </span>
          <b style={{ color: "#ff1a1a", fontSize: 18 }}>{totalAlerts}</b>
        </div>
        <span style={{ fontSize: 13, color: "#ccc" }}>
          Última atualização: {lastUpdate}
        </span>
      </div>
    </div>
  );
}

function Overview({ data, token, darkMode }) {
  const [summary, setSummary] = useState({
    resources_status: { active: 0, maintenance: 0, inactive: 0 }
  });

  useEffect(() => {
    if (token) {
      getDashboardSummary(token)
        .then(res => setSummary(res.data || { resources_status: { active: 0, maintenance: 0, inactive: 0 } }))
        .catch(() => setSummary({ resources_status: { active: 0, maintenance: 0, inactive: 0 } }));
    }
  }, [token]);

  const COLORS = ["#00C49F", "#FFBB28", "#FF1A1A"];

  const statusData = [
    { name: "Ativos", value: summary.resources_status?.active ?? 0 },
    { name: "Manutenção", value: summary.resources_status?.maintenance ?? 0 },
    { name: "Inativos", value: summary.resources_status?.inactive ?? 0 }
  ];

  // Últimos 3 recursos adicionados
  const lastResources = data.resources?.slice(-3).reverse() || [];

  return (
    <>
      <div style={{ display: "flex", gap: 32, marginTop: 32 }}>
        <InfoCard title="Usuário" value={data.user} />
        <InfoCard title="Role" value={data.role} />
        <InfoCard title="Recursos Monitorados" value={data.resources.length} />
        <div style={{ background: "#18191a", borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: "#ff1a1a", textAlign: "center" }}>Status dos Recursos</h3>
          <PieChart width={220} height={220}>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>

      <div style={{ marginTop: 36, background: "#212229", borderRadius: 16, padding: 28 }}>
        <h3 style={{ color: "#00eaff", marginBottom: 14 }}>Últimos recursos adicionados</h3>
        {lastResources.length === 0 ? (
          <span style={{ color: "#bbb" }}>Nenhum recurso cadastrado.</span>
        ) : (
          <ul>
            {lastResources.map(r => (
              <li key={r.id || r.name}>
                <b style={{ color: "#ff1a1a" }}>{r.name}</b> — {r.status} | {r.type}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function InfoCard({ title, value }) {
  return (
    <div style={{
      background: "rgba(26,26,46,0.98)",
      border: "2px solid #00eaff",
      borderRadius: 16,
      padding: 32,
      flex: 1,
      textAlign: "center",
      boxShadow: "0 0 24px #00eaff33",
      margin: 12,
      minWidth: 220
    }}>
      <h2 style={{ color: "#00eaff", marginBottom: 8, fontWeight: 700 }}>{title}</h2>
      <p style={{ fontSize: 32, margin: 0, color: "#fff", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function Section({ title, children, darkMode }) {
  return (
    <div style={{
      background: "rgba(26,26,46,0.98)",
      borderRadius: 18,
      border: "2px solid #00eaff",
      boxShadow: "0 0 32px #00eaff55",
      padding: 36,
      marginBottom: 32,
      maxWidth: 1200,
      marginLeft: "auto",
      marginRight: "auto"
    }}>
      <h2 style={{ color: "#00eaff", marginBottom: 24, fontWeight: 700 }}>{title}</h2>
      {children}
    </div>
  );
}

// Formulários dos modais
function ChangePasswordForm({ onSubmit }) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(oldPass, newPass); }}>
      <label>Senha atual:</label>
      <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} required />
      <br />
      <label>Nova senha:</label>
      <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required />
      <br />
      <button type="submit" style={{ marginTop: 12 }}>Salvar</button>
    </form>
  );
}

function CreateProfileForm({ onSubmit }) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("EMPREGADO");
  const [password, setPassword] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(username, role, password); }}>
      <label>Usuário:</label>
      <input value={username} onChange={e => setUsername(e.target.value)} required />
      <br />
      <label>Senha:</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      <br />
      <label>Papel:</label>
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="ADMIN">Admin</option>
        <option value="GERENTE">Gerente</option>
        <option value="EMPREGADO">Empregado</option>
      </select>
      <br />
      <button type="submit" style={{ marginTop: 12 }}>Criar</button>
    </form>
  );
}

function EditProfileForm({ users = [], onSubmit }) {
  const [username, setUsername] = useState(users[0]?.username || "");
  const [role, setRole] = useState("EMPREGADO");
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(username, role); }}>
      <label>Usuário a editar:</label>
      <select value={username} onChange={e => setUsername(e.target.value)} required>
        {users.map(u => (
          <option key={u.username} value={u.username}>{u.username}</option>
        ))}
      </select>
      <br />
      <label>Novo papel:</label>
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="ADMIN">Admin</option>
        <option value="GERENTE">Gerente</option>
        <option value="EMPREGADO">Empregado</option>
      </select>
      <br />
      <button type="submit" style={{ marginTop: 12 }}>Salvar</button>
    </form>
  );
}

function DeleteProfileForm({ users = [], onSubmit }) {
  const [username, setUsername] = useState(users[0]?.username || "");
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(username); }}>
      <label>Usuário a excluir:</label>
      <select value={username} onChange={e => setUsername(e.target.value)} required>
        {users.map(u => (
          <option key={u.username} value={u.username}>{u.username}</option>
        ))}
      </select>
      <br />
      <button type="submit" style={{ marginTop: 12, background: "#ff1a1a", color: "#fff" }}>Excluir</button>
    </form>
  );
}

// Novos componentes para melhorias

// Sistema de Notificações Toast
function NotificationSystem({ notifications }) {
  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="notification-toast"
          style={{
            background: getNotificationColor(notification.type),
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            maxWidth: 300,
            fontSize: 14,
            transform: "translateX(0)",
            opacity: 1,
            transition: "all 0.3s ease"
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
            {getNotificationIcon(notification.type)} {getNotificationTitle(notification.type)}
          </div>
          <div>{notification.message}</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
            {notification.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function getNotificationColor(type) {
  switch(type) {
    case "success": return "#00C851";
    case "error": return "#ff4444";
    case "warning": return "#ffbb33";
    default: return "#33b5e5";
  }
}

function getNotificationIcon(type) {
  switch(type) {
    case "success": return "✅";
    case "error": return "❌";
    case "warning": return "⚠️";
    default: return "ℹ️";
  }
}

function getNotificationTitle(type) {
  switch(type) {
    case "success": return "Sucesso";
    case "error": return "Erro";
    case "warning": return "Aviso";
    default: return "Info";
  }
}

// Indicador de Status de Rede
function NetworkStatus({ status }) {
  if (status === "online") return null;
  
  return (
    <div className="network-status-offline" style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      background: "#ff4444",
      color: "#fff",
      padding: "8px 16px",
      textAlign: "center",
      fontSize: 14,
      zIndex: 9998
    }}>
      🔴 Conexão perdida - Tentando reconectar...
    </div>
  );
}

// Loading Overlay
function LoadingOverlay() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9997
    }}>
      <div style={{
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        textAlign: "center",
        color: "#333"
      }}>
        <div className="spinner" style={{
          width: 40,
          height: 40,
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #ff1a1a",
          borderRadius: "50%",
          margin: "0 auto 16px"
        }}></div>
        <div>Carregando...</div>
      </div>
    </div>
  );
}

// Filtros de Alertas
function AlertFilters({ currentFilter, onFilterChange, alertCounts, darkMode }) {
  const filters = [
    { key: "all", label: "Todos", count: alertCounts.all },
    { key: "high", label: "Alto", count: alertCounts.high, color: "#ff4444" },
    { key: "medium", label: "Médio", count: alertCounts.medium, color: "#ffbb33" },
    { key: "low", label: "Baixo", count: alertCounts.low, color: "#00C851" }
  ];

  return (
    <div style={{ 
      display: "flex", 
      gap: 12, 
      marginBottom: 24,
      flexWrap: "wrap"
    }}>
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          style={{
            background: currentFilter === filter.key 
              ? (filter.color || (darkMode ? "#ff1a1a" : "#667eea"))
              : (darkMode ? "#333" : "#f8f9fa"),
            color: currentFilter === filter.key 
              ? "#fff" 
              : (darkMode ? "#fff" : "#333"),
            border: `1px solid ${filter.color || (darkMode ? "#555" : "#ddd")}`,
            borderRadius: 20,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: currentFilter === filter.key ? "bold" : "normal",
            transition: "all 0.2s ease"
          }}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
}

// Lista de Alertas Melhorada
function AlertsList({ alerts, onDelete, onEdit, darkMode }) {
  if (alerts.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: 40,
        color: darkMode ? "#888" : "#666",
        background: darkMode ? "#1a1a2e" : "#f8f9fa",
        borderRadius: 12,
        border: `1px dashed ${darkMode ? "#333" : "#ddd"}`
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div>Nenhum alerta encontrado com os filtros aplicados</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {alerts.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDelete={onDelete}
          onEdit={onEdit}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
}

function AlertCard({ alert, onDelete, onEdit, darkMode }) {
  const levelColors = {
    "ALTO": "#ff4444",
    "MÉDIO": "#ffbb33",
    "BAIXO": "#00C851"
  };

  return (
    <div style={{
      background: darkMode ? "#1a1a2e" : "#ffffff",
      border: `1px solid ${levelColors[alert.level] || "#333"}`,
      borderLeft: `4px solid ${levelColors[alert.level] || "#333"}`,
      borderRadius: 8,
      padding: 16,
      boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease"
    }}
    onMouseEnter={e => {
      e.target.style.transform = "translateY(-2px)";
      e.target.style.boxShadow = darkMode 
        ? "0 4px 16px rgba(0,0,0,0.4)" 
        : "0 4px 8px rgba(0,0,0,0.15)";
    }}
    onMouseLeave={e => {
      e.target.style.transform = "translateY(0)";
      e.target.style.boxShadow = darkMode 
        ? "0 2px 8px rgba(0,0,0,0.3)" 
        : "0 2px 4px rgba(0,0,0,0.1)";
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              background: levelColors[alert.level],
              color: "#fff",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: "bold"
            }}>
              {alert.level}
            </span>
            <span style={{ 
              color: darkMode ? "#00eaff" : "#667eea",
              fontWeight: "bold"
            }}>
              {alert.type}
            </span>
          </div>
          <div style={{ 
            color: darkMode ? "#fff" : "#333",
            marginBottom: 8,
            lineHeight: 1.4
          }}>
            {alert.message}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: darkMode ? "#888" : "#666",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span>🕒 {new Date(alert.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
          <button
            onClick={() => onEdit(alert.id, alert.message)}
            style={{
              background: darkMode ? "#333" : "#f8f9fa",
              color: darkMode ? "#fff" : "#333",
              border: `1px solid ${darkMode ? "#555" : "#ddd"}`,
              borderRadius: 4,
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: 12,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => e.target.style.background = darkMode ? "#444" : "#e9ecef"}
            onMouseLeave={e => e.target.style.background = darkMode ? "#333" : "#f8f9fa"}
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => onDelete(alert.id)}
            style={{
              background: "#ff4444",
              color: "#fff",
              border: "1px solid #ff4444",
              borderRadius: 4,
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: 12,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => e.target.style.background = "#ff3333"}
            onMouseLeave={e => e.target.style.background = "#ff4444"}
          >
            🗑️ Remover
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal simples
function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "rgba(26,26,46,0.98)",
        borderRadius: 18,
        border: "2px solid #00eaff",
        boxShadow: "0 0 32px #00eaff55",
        padding: 40,
        minWidth: 340,
        color: "#fff",
        position: "relative"
      }}>
        <h2 style={{ marginTop: 0, color: "#00eaff", fontWeight: 700 }}>{title}</h2>
        {children}
        <button style={{
          marginTop: 24,
          background: "#00C851",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 24px",
          cursor: "pointer",
          fontSize: 16,
          fontWeight: "bold",
          transition: "background 0.2s",
        }}
        onMouseEnter={e => e.target.style.background = "#00a844"}
        onMouseLeave={e => e.target.style.background = "#00C851"}
        onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

export default Dashboard;