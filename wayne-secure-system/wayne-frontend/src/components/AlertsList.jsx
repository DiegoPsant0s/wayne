import React from "react";
import "../styles/cyberpunk.css";

const AlertsList = ({ alerts, onDelete, onEdit, darkMode }) => {
  if (!alerts || alerts.length === 0) {
    return <div style={{
      background: 'rgba(26,26,46,0.98)',
      borderRadius: 14,
      border: '2px solid #00eaff',
      boxShadow: '0 0 16px #00eaff33',
      padding: 32,
      color: '#fff',
      textAlign: 'center',
      fontSize: 18,
      marginBottom: 24
    }}>Nenhum alerta no momento</div>;
  }
  return (
    <div style={{ width: '100%' }}>
      {alerts.map((alert, idx) => (
        <div key={alert.id || idx} style={{
          background: 'rgba(26,26,46,0.98)',
          borderRadius: 14,
          border: '2px solid #00eaff',
          boxShadow: '0 0 16px #00eaff33',
          padding: 24,
          marginBottom: 18,
          color: '#fff',
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{
              background: '#ff4444',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 12,
              fontWeight: 'bold',
              fontSize: 14,
              marginRight: 12
            }}>{alert.level}</span>
            <span style={{ fontWeight: "bold", color: "#00eaff", fontSize: 18 }}>{alert.message}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#00eaff" }}>
            {alert.timestamp && <span>Recebido: {new Date(alert.timestamp).toLocaleString()}</span>}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button style={{
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 16,
              fontWeight: 'bold',
              boxShadow: '0 2px 8px #ff4444aa',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = '#cc3333'}
            onMouseLeave={e => e.target.style.background = '#ff4444'}
            onClick={() => onDelete(alert.id)}>Excluir</button>
            <button style={{
              background: '#00eaff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 16,
              fontWeight: 'bold',
              boxShadow: '0 2px 8px #00eaff55',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = '#0099cc'}
            onMouseLeave={e => e.target.style.background = '#00eaff'}
            onClick={() => onEdit(alert.id, alert.message)}>Editar</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertsList;
