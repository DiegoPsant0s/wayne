import React, { useEffect, useState } from "react";
import AlertsList from "./AlertsList";
import { getAlerts, deleteAlert, editAlert } from "../services/api";

const AlertsPage = ({ user, onAuthError, darkMode }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.token) {
      setLoading(true);
      getAlerts(user.token)
        .then(res => setAlerts(res.data))
        .catch(err => {
          if (err.status === 401 && onAuthError) onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
          setAlerts([]);
        })
        .finally(() => setLoading(false));
    }
  }, [user, onAuthError]);

  const handleDelete = (id) => {
    if (window.confirm("Deseja remover este alerta?")) {
      deleteAlert(id, user.token).then(() => {
        setAlerts(alerts => alerts.filter(a => a.id !== id));
      });
    }
  };

  const handleEdit = (id, oldMessage) => {
    const newMsg = prompt("Nova mensagem do alerta:", oldMessage);
    if (newMsg && newMsg !== oldMessage) {
      editAlert(id, { message: newMsg }, user.token).then(() => {
        setAlerts(alerts => alerts.map(a => a.id === id ? { ...a, message: newMsg } : a));
      });
    }
  };

  return (
    <div style={{ minHeight: "80vh", padding: 32 }}>
      <h2 style={{ color: "#00fff7", fontFamily: "Orbitron, Arial", marginBottom: 24 }}>Alertas do Sistema</h2>
      {loading ? (
        <div style={{ color: "#00fff7" }}>Carregando alertas...</div>
      ) : (
        <AlertsList alerts={Array.isArray(alerts.data) ? alerts.data : []} onDelete={handleDelete} onEdit={handleEdit} darkMode={darkMode} />
      )}
    </div>
  );
};

export default AlertsPage;
