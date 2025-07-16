import React from 'react';

const Navbar = ({ user, currentView, onViewChange, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'resources', label: 'Recursos', icon: '🔐' },
    { id: 'alerts', label: 'Alertas', icon: '⚠️' },
    { id: 'profiles', label: 'Perfis', icon: '👤' },
  ];

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      background: "linear-gradient(90deg, #0f0f23 0%, #1a1a2e 60%, #00eaff 100%)",
      borderBottom: "3px solid #00eaff",
      padding: "0 32px",
      height: 80,
      boxShadow: "0 2px 24px #00eaff99, 0 2px 12px #ff0055aa"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        marginRight: 40
      }}>
        <span style={{
          color: "#00eaff",
          fontFamily: "Orbitron, 'Segoe UI', Arial, sans-serif",
          fontWeight: "bold",
          fontSize: 28,
          letterSpacing: 2,
          textShadow: "0 0 12px #00eaff, 0 0 4px #ff0055"
        }}>
          <span style={{
            background: 'linear-gradient(90deg, #00eaff 0%, #ff0055 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
            fontSize: 32,
            marginRight: 8
          }}>🦇</span>
          Wayne Secure
        </span>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={navBtnStyle(currentView === item.id)}
            tabIndex={0}
            aria-label={item.label}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                onViewChange(item.id);
              }
            }}
            onMouseEnter={e => {
              e.target.style.boxShadow = '0 0 16px #00eaff, 0 0 8px #ff0055';
              e.target.style.background = 'linear-gradient(90deg, #00eaff 0%, #ff0055 100%)';
              e.target.style.color = '#181828';
            }}
            onMouseLeave={e => {
              Object.assign(e.target.style, navBtnStyle(currentView === item.id));
            }}
          >
            <span style={{ marginRight: "8px", fontSize: 20, textShadow: "0 0 8px #00eaff, 0 0 2px #ff0055" }}>{item.icon}</span>
            <span style={{ fontWeight: 700 }}>{item.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "20px"
      }}>
        <div style={{
          background: 'rgba(26,26,46,0.98)',
          borderRadius: 12,
          border: '2px solid #00eaff',
          boxShadow: '0 0 16px #00eaff99, 0 0 8px #ff0055aa',
          padding: '8px 18px',
          color: "#fff",
          fontSize: "15px",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          minWidth: 100
        }}>
          <div style={{ fontWeight: "bold", color: "#00eaff", textShadow: "0 0 8px #00eaff" }}>{user?.username}</div>
          <div style={{ color: "#ff0055", fontSize: "13px", fontWeight: "bold", textShadow: "0 0 4px #ff0055" }}>{user?.role}</div>
        </div>

        <button onClick={onLogout} style={{
          background: "linear-gradient(90deg, #ff0055 0%, #00eaff 100%)",
          color: "#fff",
          fontWeight: "bold",
          border: "2px solid #00eaff",
          borderRadius: "10px",
          padding: "10px 22px",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 0 12px #ff0055, 0 0 8px #00eaff",
          transition: "background 0.2s, color 0.2s, box-shadow 0.2s"
        }}
        onMouseEnter={e => {
          e.target.style.background = 'linear-gradient(90deg, #00eaff 0%, #ff0055 100%)';
          e.target.style.boxShadow = '0 0 24px #00eaff, 0 0 12px #ff0055';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'linear-gradient(90deg, #ff0055 0%, #00eaff 100%)';
          e.target.style.boxShadow = '0 0 12px #ff0055, 0 0 8px #00eaff';
        }}>Sair</button>

        <button style={{
          background: "linear-gradient(90deg, #00eaff 0%, #ff0055 100%)",
          color: "#fff",
          fontWeight: "bold",
          border: "2px solid #00eaff",
          borderRadius: "10px",
          padding: "10px 22px",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 0 12px #00eaff, 0 0 8px #ff0055",
          transition: "background 0.2s, color 0.2s, box-shadow 0.2s"
        }}
        onClick={() => window.open('mailto:suporte@wayne-sec.com?subject=Ajuda%20-%20Wayne%20Secure%20System', '_blank')}
        >Ajuda</button>
      </div>
    </nav>
  );
};

function navBtnStyle(active) {
  return {
    background: active ? "linear-gradient(90deg, #00eaff 0%, #ff0055 100%)" : "#181828",
    color: active ? "#181828" : "#00eaff",
    fontWeight: "bold",
    border: active ? "2px solid #00eaff" : "2px solid #181828",
    borderRadius: "10px",
    padding: "10px 22px",
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: active ? "0 0 16px #00eaff, 0 0 8px #ff0055" : "0 0 8px #ff0055",
    transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
    display: "flex",
    alignItems: "center"
  };
}

export default Navbar;